# V3 Frontend Authority Contract

V3 的声明式前端是可执行边界，不是目录命名约定。`src/manifest.json` 决定页面集合；当前 17 个真实产品 route 全部必须映射到且只映射到一个 Surface JSON。

## 设计目标：JSON 是 Design IR，不是最终目的

Surface JSON 的价值不是“把 UX 改写成 JSON”，而是把产品设计转成稳定、结构化、可验证、可编辑的 **Design IR（Design Intermediate Representation，设计中间表示）**。

它应同时服务四类消费者：

1. Runtime：由通用 renderer/engine 解释并运行；
2. 人类开发者：可直接查看、调整和 code review；
3. AI：可在明确 schema、token、binding 与 adaptation contract 下进行可靠修改；
4. 后续辅助设计软件：可视化编辑同一份模型，而不是再维护一套设计稿到代码的人工映射。

因此，JSON 化本身不是成功标准。若为了进入 JSON 而降低交互质量、抹平 Circle/Pill/Rect 差异、复制大量坐标、或让 schema 演化成难以理解的低级 UI 指令集，都属于失败。

## 唯一链路

```text
manifest route
  → one Surface JSON (Design IR)
  → generic surface_runtime / experience engines
  → generic surface_host
  → thin page UX

controller registry
  → Feature
  → Domain / Capability
  → semantic state/actions
```

## Surface JSON 拥有

Surface JSON 是页面产品表达的唯一 authored authority，必须拥有：

- 模块/区域的产品结构与顺序；
- generic primitive / experience / engine 的选择；
- 静态 copy 与可视状态映射；
- semantic data binding 与 action ID；
- 尺寸、间距、圆角、字体、颜色等 visual tokens；
- `base / circle / pill / rect` 的 form-factor adaptation；
- L3 页面所需的 shape-specific composition/engine parameters；
- 纯 UI 初始状态（如当前分页），但不得伪造电量、健康、传感器、连接状态等业务事实。

## 三种形态不要求长得一样

“同一个 Surface JSON”不等于三个形态共用同一种布局。

适配深度由三级模型决定：

- **L1 shared-expression**：产品表达和交互模型相同，但 Circle/Pill/Rect 可以有明显不同的尺寸、密度、排版、卡片比例与局部几何。
- **L2 local-expression**：语义、数据和动作共享，但特定区域可以在不同形态采用不同的局部 composition，例如趋势图方向、指标排列、日历密度。
- **L3 independent-surface**：形态需要不同的核心交互/空间模型时，可以选择完全不同的 generic experience/composition，例如 Circle honeycomb、Pill paged list、Rect designed grid。

三级适配描述的是“差异深度”，不是页面复杂度，也不是 JSON 文件数量。应始终使用满足产品体验的最低正确级别。

## 页面 UX 只允许

迁移后的 `src/pages/**/*.ux` 只允许：引入 `surface_host.ux` 与 `surface_page.js`；绑定一个 Surface id；转发生命周期、返回键和 Surface action。页面不得拥有产品专属 `div/stack/scroll/text/image/slider` 结构、颜色/px 常量、shape 分支、静态 copy 或 page style。

## Renderer 不能成为第二前端

所有页面使用固定 renderer `surface-v1`。`surface_runtime.js`、`surface_host.ux` 与 generic engines 只实现 schema primitive 和可复用交互算法，不得按 route、surface id、controller id 写产品特判，也不得保存产品颜色、页面尺寸、产品 copy 或隐藏的 form-factor 设计默认值。

一个 generic primitive 可以拥有算法默认行为；但任何会改变产品视觉身份或交互表达的参数都应由 JSON 明确声明。L3 engine 缺失必要设计参数时优先 fail contract，而不是偷偷生成一个“看起来能用”的设计。

## Design IR 的风险边界

声明式架构存在几个真实风险，需要持续约束：

- **JSON 低级化**：如果大量记录 absolute x/y、重复 style 和逐像素结构，JSON 会退化成不可维护的序列化 DOM。优先表达语义、composition、token 和约束。
- **Schema 无限膨胀**：不能为了单个页面不断增加专用字段。新能力必须证明可复用，否则应重新审视设计或抽象层级。
- **Renderer 偷业务**：为了“让 JSON 更简单”把 page ID、文案、颜色、业务状态判断塞进 renderer，会重新形成第二前端。
- **过度统一**：为了 generic renderer 强迫所有形态共享同一布局，会直接破坏三级适配模型。
- **过度分叉**：反过来把普通尺寸差异全部升级到 L3，会导致三个形态逐渐成为三套产品，维护成本失控。
- **无类型字符串协议**：binding/action/path/status key 若任意拼写，长期会出现静默错误。schema、compile-time audit 和 controller contract 必须逐步强化。
- **设计工具往返损失**：未来 GUI editor 必须编辑同一 Design IR；若工具生成另一套中间文件再编译到 JSON，会重新产生双权威问题。

## 面向辅助设计软件的原则

未来设计工具不应“生成一份新的前端代码”，而应成为 Surface JSON 的结构化编辑器。建议模型层保持稳定分层：

```text
Product semantics
  ├─ modules / content / binding / actions
  ├─ adaptation level + form-factor variants
  ├─ composition / experience selection
  └─ visual tokens

Runtime implementation
  ├─ primitive renderers
  ├─ reusable interaction engines
  └─ semantic controllers
```

这样设计软件可以展示节点树、token inspector、Circle/Pill/Rect preview、binding/action picker 和 adaptation diff，而不用理解 QuickApp UX 细节。

## 当前完成条件

迁移完成后仓库必须同时满足：

- 17/17 manifest route 有一一对应 Surface JSON；
- `src/v2` 不存在；
- `src/product/design/apps` 不存在；
- `src/components/watchfaces` 等产品专属 UX 不存在；
- 未引用的旧 raster visual assets 不存在；
- `npm run check` 直接执行 `v3:frontend-contract` strict gate，而不是 staged gate；
- parity contract 证明 JSON 化没有删除已接受的功能、手势和 form-factor 表达。

## 命令

```bash
npm run v3:frontend-audit
npm run v3:frontend-contract
npm run check
```

`v3:frontend-audit` 用于阅读报告；`v3:frontend-contract` 是合并门禁。新增任何 route、额外 page UX、未绑定 Surface JSON、页面专属 Design JS 或第二产品 UX 都会让 strict contract 失败。
