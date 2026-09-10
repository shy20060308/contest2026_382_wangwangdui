# V3 Frontend Authority Contract

V3 的“声明式前端”不是命名约定，而是可执行边界。`src/manifest.json` 决定页面集合；每个路由页面必须映射到且只映射到一个 JSON Surface。JSON Surface 是页面视觉结构和视觉参数的唯一权威来源。

## 唯一链路

```text
manifest route
  → one surface JSON
  → generic surface runtime / renderer
  → thin page host UX

controller registry
  → Feature
  → Domain / Capability
  → state bindings exposed to the surface
```

页面 UX 不是第二套设计文件。它只负责承载通用 Surface Host、生命周期转发和框架所需的事件桥接。

## JSON Surface 拥有什么

每个 Surface JSON 必须声明：

- `id`、`route`、`renderer` 和 `controller`；
- 模块顺序；
- 模块的通用 primitive 类型；
- 静态可见文案；
- 数据绑定 ID 和 action ID；
- 尺寸、间距、圆角、字体、颜色、背景等视觉 token；
- `base / circle / pill / rect` 的视觉差异。

数组顺序就是模块顺序。禁止在 UX 或页面专属 JS 中重新排一套模块。

## JS 可以做什么

- Device Profile：规范化设备事实；
- Scene / Adapter：坐标投影和 box model 翻译；
- Resolver：只做静态 JSON 无法表达的纯组合几何；
- View projector：把业务状态投影为绑定值；
- Controller：生命周期、Feature 编排、事件处理；
- 通用 renderer：实现 schema 中定义的通用 primitive。

这些 JS 都不能保存页面专属的第二套颜色、尺寸、文案、模块顺序或 shape 设计默认值。

## 页面 UX 禁止拥有的内容

迁移完成后的 `src/pages/**/*.ux`：

1. 不直接 import `design`、`features`、`domain`、`capabilities` 或旧 `src/v2`；
2. 不出现页面专属 `div / stack / scroll / text / image / slider` 结构；
3. 不出现硬编码 px 尺寸、hex 颜色、圆角、间距；
4. 不出现 `pill / circle / rect`、`formFactor`、`screenShape` 分支；
5. 不保存静态可见文案；
6. 不保存页面专属 `<style>`；
7. 只声明本页 `surfaceId`，并交给统一的 `surface-host`。

因此，即使有人新建一个叫 “v3” 的手写页面，只要它绕过 JSON Surface，严格审计就会失败。

## Renderer 也不能成为隐藏的第二前端

所有页面只能使用固定 renderer ID：`surface-v1`。禁止创建 `health-renderer`、`history-renderer` 之类页面专属 renderer。

Renderer 只能识别 schema 允许的通用 primitive，不得按 route、surface id 或页面名称写分支。产品专属结构必须在 JSON modules 中声明。

## 路由与 Surface 必须一一对应

审计以 `manifest.router.pages` 为事实源，自动得到所有页面。对每一个 route：

- 对应 UX 必须存在；
- 对应 Surface JSON 必须存在且 `route` 完全一致；
- Surface `id` 和 `route` 在全项目唯一；
- 不允许额外的未路由 page UX；
- 不允许额外的未绑定 Surface JSON。

新增路由会自动进入审计，不维护第二份手工页面名单。

## 非页面 UX

`src/app.ux` 只允许作为应用壳。`src/components/surface_host.ux` 及其通用 primitive 是 renderer 实现。其它产品专属 UX（包括旧的专属 watchface UX）都属于第二前端权威，最终必须迁入 Surface JSON 或明确注册为 schema primitive 并证明其通用性。

## 迁移门槛

迁移期间：

- `npm run v3:frontend-audit` 输出逐路由报告，不阻断开发；
- `npm run v3:frontend-contract` 使用严格模式，未迁移页面会失败。

只有所有 manifest 页面完成迁移、严格模式全绿之后，`v3:frontend-contract` 才加入 `npm run check`，并删除 `src/v2`。在此之前不得宣称“V3 前端迁移完成”。
