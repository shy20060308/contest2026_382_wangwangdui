# 维护者指南

本文描述 `vela_band` 3.0 当前维护边界。历史实现只存在于 Git 历史中；当前源码不保留 V2 namespace 或双前端兼容路径。

## 事实来源

发生实现与文档冲突时，按职责核对：

1. `src/manifest.json`：权限、feature、route、entry。
2. `src/capabilities/*`：原生 Vela 能力边界和原生值规范化。
3. `src/domain/*`：业务状态、状态机与持久化。
4. `src/product/features/*`：应用级 orchestration 与资源生命周期。
5. `src/runtime/device_profile.js`：物理设备事实与 safe inset。
6. `src/product/design/scene.js`：Host Scene 投影。
7. `src/product/frontend/surfaces/*.json`：页面视觉结构与 shape variants。
8. `src/product/frontend/runtime/surface_runtime.js`：通用 Surface 解释器。
9. `src/components/surface_host.ux`：唯一产品 renderer。
10. `src/product/controller_registry.js`：Surface state/action 到 Feature 的语义桥。
11. `test/*`：可执行 contract。

## 唯一产品链

```text
Native APIs → Capability → Domain → Feature
                               ↓
                    semantic state/actions
                               ↓
Device Profile → Host Scene → Surface JSON → Surface Runtime → Surface Host → Page shell
```

页面 shell 不持有页面视觉。Circle/Pill/Rect 差异只属于 Surface JSON variants。

## 一个事实，一个 owner

原生数据在 Capability 规范化一次；业务状态由 Domain 校验和持久化；Feature 编排生命周期；Device Profile 验证设备事实；Surface JSON 拥有视觉；generic runtime 只翻译。不要在下游重复 Number/clamp/default，也不要把业务 fallback 写进 UX。

## UI 修改

改 UI 时先找对应 `src/product/frontend/surfaces/<route>.json`。如果只是文案、颜色、字号、间距、圆角、模块顺序或 shape 差异，只改 JSON。

如果需要新交互，先判断是否已有通用 module primitive；没有时可以扩展 schema/runtime/host，但实现必须对所有 route 通用，不得出现 route/surface/controller 名称特判。业务动作进入 `controller_registry` 或 Feature，视觉 token 不得进入 Feature。

## 设备与几何

`device_profile.js` 验证物理信息；`scene.js` 只做 192 design-width 投影；`adapter.js` 只做通用 region/box translation。禁止根据组件宽度重算 safe area、circle chord 扫描、Y scanning、aesthetic scale、缺字段视觉兜底或运行时修复 authored geometry。

## 数据真实性

健康、运动、传感器、电量和同步页面必须消费真实 Capability/Domain 状态。未知值保持 `null`/unavailable，最终由 Surface formatting 显示为 `--` 或明确不可用状态；不得生成伪健康样本或伪趋势。

## 生命周期

页面仅调用 `surfacePage.bind/show/hide/destroy/action`。需要 sensor、health、location、system event、timer 或 interconnect 的 Feature 必须在 stop/destroy 中释放资源，并保护异步回调不要在页面销毁后回写状态。

## 持久化

破坏性 V3 使用干净 namespace；不为旧 schema 在正式 runtime 留长期 migration bridge。历史版本由 Git 保存。

## 合并前验证

在 `quickapp/velaclaw-aiot` 下运行：

```bash
npm ci
npm run check
npm run build
```

核心架构门禁：

```bash
npm run v3:architecture
npm run v3:design
npm run v3:surfaces
npm run v3:frontend-contract
npm run v3:truth
```

失败时修正 ownership，不要通过恢复 `src/v2`、页面 CSS/DOM、兼容 bridge、hidden fallback 或第二套 renderer 绕过测试。
