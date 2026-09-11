# V3 Design Runtime

V3 是破坏性重构。兼容历史保留在 Git 历史中，当前运行时代码不保留 V2 bridge、第二套页面视觉实现或按设备临时修补的布局路径。

## 唯一前端链路

```text
Device Profile
  → Host Scene + declared safe insets
  → Surface JSON
  → generic Surface Runtime / generic Experience Engine
  → generic Surface Host
  → Quick App page shell

Controller Registry
  → Feature Controller
  → Domain / Capability
  → semantic state
  → Surface bindings/actions
```

`src/manifest.json` 是路由事实源。每个 manifest route 必须且只能对应一个 `src/product/frontend/surfaces/*.json`。页面 UX 只声明 Surface id、生命周期和 action bridge，不拥有产品 DOM、文案、颜色、尺寸或 shape 分支。

## 三级差异设计理论

三级理论描述的是**跨形态差异有多深**，不是“页面复杂度”。原始定义保持不变：

- **L1 / shared-expression**：同一个产品、同一种表达，只改变几何、密度、字号和可用空间。
- **L2 / local-expression**：产品、数据与动作继续共享，但局部模块的表达方式因形态而变化。
- **L3 / independent-surface**：至少一种形态需要真正不同的产品/交互表面，例如 Circle Honeycomb 与 Pill Paged List。

等级属于差异本身，不属于整个页面。为了工程治理，`src/product/frontend/adaptation-policy.json` 给每个 route 记录 `routeLevel`，它表示该 route 所需要的**最高差异等级**；不能因为 route 是 L3，就把所有模块都做成独立实现。

### 与 JSON 化程度的对应关系

- **L1**：最大程度共享 JSON。模块、内容、动作和交互语义共用；Circle/Pill/Rect 只通过 token/geometry variant 调整。亮度 Slider 这类所有形态都相同的直接操作仍然属于 L1。
- **L2**：仍然只有一份共享 JSON 产品模型，但允许模块级 variant 对局部表达进行变化；不得复制整页 Surface。
- **L3**：JSON 仍然是产品权威，但允许 shape 选择不同的通用 Experience/Engine/Composition。Engine 只实现可复用算法与交互物理，不得拥有 route、产品文案、产品颜色或 fallback 视觉值。

当前从已验收 V2.4 设计基线继承的等级包括：Heart/Steps/Settings/Brightness/Notification/Workout Select/Workout History 为 L1；History/Workout/Today 为 L2；Launcher/Clock/Faces 为 L3。迁移不得擅自把 L3 降成普通列表，也不得为了“更 JSON”把 L1/L2 无意义升级成独立 Engine。

## Ownership

- `src/runtime/device_profile.js`：验证物理尺寸、形态和声明式 safe inset。
- `src/product/design/scene.js`：把物理设备投影到 192 design-width Host Scene。
- `src/product/design/adapter.js`：通用 box/region 翻译；不做视觉修复。
- `src/product/frontend/adaptation-policy.json`：三级差异策略与各 route 的最高适配等级。
- `src/product/frontend/surfaces/*.json`：模块顺序、静态 copy、颜色、字号、间距、圆角、shape variants 和 experience 声明的唯一产品视觉/交互权威。
- `src/product/frontend/runtime/surface_runtime.js`：只解释 schema 中的通用 primitive，不识别具体 route/surface/controller。
- `src/product/frontend/engines/*`：仅为 L3 等需要提供产品无关的通用几何/交互算法。
- `src/components/surface_host.ux`：唯一产品 renderer；通用 collection/slider 等组件只能实现 schema primitive。
- `src/product/controller_registry.js`：把 Surface action/state 连接到语义 Feature；不得拥有视觉 token。
- Feature / Domain / Capability：业务与设备能力，不拥有页面视觉。

## 强制规则

1. 不存在 `src/v2`、`src/presentation`、`src/platform`。
2. 不存在 `src/product/design/apps` 页面专属 JS Recipe/View。
3. 不存在 `src/components/watchfaces` 等产品专属第二 UX 树。
4. 页面 UX 不直接 import Feature、Domain、Capability、Design App。
5. L1 的 shape 差异只允许 token/geometry；L2 允许局部模块表达变化；只有 L3 才允许 shape 选择独立 Experience/Engine。
6. Adapter/Scene 不做 chord fitting、Y 扫描、自动缩放、aesthetic clamp 或组件宽度驱动的 safe-area 重算。
7. Generic Engine 不得知道 route/app id，也不得写死产品 copy、产品色彩、图标尺寸或视觉 fallback。
8. 健康、运动、传感器和同步状态必须来自真实业务层；视觉层不得生成伪样本。
9. 新增路由时必须同时新增 Surface JSON 和 adaptation-policy entry；严格审计从 manifest 自动发现页面，不维护第二份路由白名单。
10. 迁移验收同时验证“架构唯一性”和“V2.4 产品体验 parity”；CI 变绿不能证明交互降级是可接受的。

## 验证

```bash
npm run v3:architecture
npm run v3:design
npm run v3:adaptation
npm run v3:surfaces
npm run v3:frontend-contract
npm run v3:frontend-runtime
npm run v3:interaction-parity
npm run v3:truth
```

`npm run check` 必须包含 strict frontend contract、三级适配合同和 interaction parity。只有所有当前 manifest route 都走唯一链路、并且其差异实现不越级/降级时检查才能通过。
