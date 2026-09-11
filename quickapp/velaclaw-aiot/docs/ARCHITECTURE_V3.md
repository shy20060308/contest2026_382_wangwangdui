# V3 Design Runtime

V3 是破坏性重构。兼容历史保留在 Git 历史中，当前运行时代码不保留 V2 bridge、第二套页面视觉实现或按设备临时修补的布局路径。

## 唯一前端链路

```text
Device Profile
  → Host Scene + declared safe insets
  → Surface JSON
  → generic Surface Runtime
  → generic Surface Host
  → Quick App page shell

Controller Registry
  → Feature Controller
  → Domain / Capability
  → semantic state
  → Surface bindings/actions
```

`src/manifest.json` 是路由事实源。每个 manifest route 必须且只能对应一个 `src/product/frontend/surfaces/*.json`。页面 UX 只声明 Surface id、生命周期和 action bridge，不拥有产品 DOM、文案、颜色、尺寸或 shape 分支。

## Ownership

- `src/runtime/device_profile.js`：验证物理尺寸、形态和声明式 safe inset。
- `src/product/design/scene.js`：把物理设备投影到 192 design-width Host Scene。
- `src/product/design/adapter.js`：通用 box/region 翻译；不做视觉修复。
- `src/product/frontend/surfaces/*.json`：模块顺序、静态 copy、颜色、字号、间距、圆角、Circle/Pill/Rect variant 的唯一视觉权威。
- `src/product/frontend/runtime/surface_runtime.js`：只解释 schema 中的通用 primitive，不识别具体 route/surface/controller。
- `src/components/surface_host.ux`：唯一产品 renderer。
- `src/product/controller_registry.js`：把 Surface action/state 连接到语义 Feature；不得拥有视觉 token。
- Feature / Domain / Capability：业务与设备能力，不拥有页面视觉。

## 强制规则

1. 不存在 `src/v2`、`src/presentation`、`src/platform`。
2. 不存在 `src/product/design/apps` 页面专属 JS Recipe/View。
3. 不存在 `src/components/watchfaces` 等产品专属第二 UX 树。
4. 页面 UX 不直接 import Feature、Domain、Capability、Design App。
5. Surface shape 差异只写在 `variants.base/circle/pill/rect`。
6. Adapter/Scene 不做 chord fitting、Y 扫描、自动缩放、aesthetic clamp 或组件宽度驱动的 safe-area 重算。
7. 健康、运动、传感器和同步状态必须来自真实业务层；视觉层不得生成伪样本。
8. 新增路由时必须同时新增 Surface JSON；严格审计从 manifest 自动发现页面，不维护第二份白名单。

## 验证

```bash
npm run v3:architecture
npm run v3:design
npm run v3:surfaces
npm run v3:frontend-contract
npm run v3:frontend-runtime
npm run v3:truth
```

`npm run check` 已包含 strict frontend contract。只有所有 18 个当前 manifest route 都走上述唯一链路时检查才能通过。
