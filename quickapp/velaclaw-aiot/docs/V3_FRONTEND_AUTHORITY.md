# V3 Frontend Authority Contract

V3 的声明式前端是可执行边界，不是目录命名约定。`src/manifest.json` 决定页面集合；当前 18 个 route 全部必须映射到且只映射到一个 Surface JSON。

## 唯一链路

```text
manifest route
  → one Surface JSON
  → generic surface_runtime
  → generic surface_host
  → thin page UX

controller registry
  → Feature
  → Domain / Capability
  → semantic state/actions
```

## Surface JSON 拥有

Surface JSON 是页面视觉结构和视觉参数的唯一权威，必须拥有模块顺序、通用 primitive、静态可见文案、数据 binding/action ID、尺寸/间距/圆角/字体/颜色，以及 `base / circle / pill / rect` variants。

## 页面 UX 只允许

迁移后的 `src/pages/**/*.ux` 只允许：引入 `surface_host.ux` 与 `surface_page.js`；绑定一个 Surface id；转发生命周期、返回键和 Surface action。页面不得拥有产品专属 `div/stack/scroll/text/image/slider` 结构、颜色/px 常量、shape 分支、静态 copy 或 page style。

## Renderer 不能成为第二前端

所有页面使用固定 renderer `surface-v1`。`surface_runtime.js` 和 `surface_host.ux` 只实现 schema primitive，不得按 route、surface id、controller id 写特判，也不得保存页面颜色/尺寸默认值。

## 当前完成条件

迁移完成后仓库必须同时满足：

- 18/18 manifest route 有一一对应 Surface JSON；
- `src/v2` 不存在；
- `src/product/design/apps` 不存在；
- `src/components/watchfaces` 等产品专属 UX 不存在；
- 未引用的旧 raster icon/watchface package assets 不存在；
- `npm run check` 直接执行 `v3:frontend-contract` strict gate，而不是 staged gate。

## 命令

```bash
npm run v3:frontend-audit
npm run v3:frontend-contract
npm run check
```

`v3:frontend-audit` 用于阅读报告；`v3:frontend-contract` 是合并门禁。新增任何 route、额外 page UX、未绑定 Surface JSON、页面专属 Design JS 或第二产品 UX 都会让 strict contract 失败。
