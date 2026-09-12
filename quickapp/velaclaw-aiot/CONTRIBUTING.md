# Contributing to vela_band

感谢参与 `vela_band`。当前工程维护 V3 单一产品链：

```text
Vela Native APIs → Capabilities → Domain → Feature Controllers
                                          ↓ semantic state/actions
Device Profile → Host Scene → Surface JSON
                               ↓
                   Surface / Stage / Experience Runtime
                               ↓
                   generic Surface Host / Components
                               ↓
                         thin page UX
```

Git 历史负责保存旧实现；当前源码不建立 V2、旧 presentation 或第二套产品前端兼容路径。

## 开发环境

- Node.js 18+
- npm
- AIoT-IDE / Vela Quick App 工具链
- 赛事指定镜像或目标设备

```bash
npm ci
npm run check
npm run build
```

## 所有权

- `src/capabilities/*`：Vela 原生 API、能力可用性与原生值规范化。
- `src/domain/*`：canonical 业务状态、状态机与持久化语义。
- `src/product/features/*`：应用级业务编排与资源生命周期。
- `src/runtime/*`：Device Profile、Page、Navigation、Power、Haptics 等通用 runtime。
- `src/product/design/*`：通用 Host Scene / Adapter，不拥有页面视觉。
- `src/product/frontend/surfaces/*.json`：产品文案、visual token、模块结构、binding、action、shape variant 与 experience 选择。
- `src/product/frontend/runtime/*`、`engines/*`：通用 Surface / Experience 解释和可复用交互算法。
- `src/components/*`：通用 renderer / primitive。
- `src/pages/**/*.ux`：thin page shell。

不要恢复 `src/v2`、旧 `src/presentation`、页面专属 `product/design/apps`、专属 watchface UX 或把产品视觉重新写进页面 CSS/DOM。

## UI 修改

先修改对应 `src/product/frontend/surfaces/<route>.json`：

- 文案、颜色、字号、间距、圆角、模块顺序 → Surface JSON；
- Circle / Pill / Rect 几何或密度 → Surface variants；
- 局部 form-factor 表达差异 → L2 module variant；
- 真正不同的核心交互/空间模型 → L3 Surface 选择通用 experience/engine；
- 业务状态、持久化、传感器、设备行为 → Feature / Domain / Capability。

只有真正可复用的设计概念才扩展 schema/runtime/component。Generic renderer/engine 不允许出现 route-specific copy、颜色、页面 ID 或隐藏视觉 fallback。

设计任务使用 [`skills/vela-surface-design/SKILL.md`](skills/vela-surface-design/SKILL.md)。

## Runtime / 数据修改

真实健康、运动、传感器、电量与连接状态来自对应业务层；未知值保持 unavailable/null/error，不用默认数字冒充实测。

订阅、定时器、位置、健康、事件和传输都必须有明确 owner/generation。stop/destroy 先让旧 owner 失效，再释放 native resource，迟到 callback 不得修改新实例。

持久化变更要覆盖失败窗口、重试、幂等与恢复；损坏数据先 quarantine 再显式 reset，I/O failure 不触发破坏性删除。

Runtime、生命周期、协议、持久化与性能任务使用 [`skills/vela-runtime-refactor/SKILL.md`](skills/vela-runtime-refactor/SKILL.md)。

## 三形态适配

L1 / L2 / L3 描述差异深度，不描述页面复杂度：

- L1：共享表达，仅调整 geometry / density；
- L2：共享产品与动作，局部 module 表达随形态变化；
- L3：形态需要不同 composition / interaction，但产品 authority 仍在 JSON。

不要为了 generic renderer 把 Honeycomb、pager、Slider、watchface composition 等已接受交互降级成普通按钮/列表，也不要把普通几何差异无意义升级为 L3。

## 验证

合并前运行：

```bash
npm run check
npm run build
```

常用 V3 门禁：

```bash
npm run v3:architecture
npm run v3:design
npm run v3:adaptation
npm run v3:surfaces
npm run v3:schema
npm run v3:frontend-contract
npm run v3:frontend-runtime
npm run v3:performance
npm run v3:interaction-parity
npm run v3:truth
npm run v3:package-hygiene
```

设备、触摸、传感器与性能数据按 `docs/DEVICE_ACCEPTANCE_CHECKLIST.md` 和 `docs/PERFORMANCE_BASELINE_TEMPLATE.md` 记录。

## 文档

架构或产品能力发生变化时同步维护：

- `README.md`
- `docs/README_EN.md`
- `docs/ARCHITECTURE_V3.md`
- `docs/V3_FRONTEND_AUTHORITY.md`
- `docs/PROJECT_OWNER_GUIDE.md`

Skill 规则维护在 `skills/` 内，不把 Skill 的工作流复制进 `docs/`。历史架构说明由 Git 历史保存。

## 提交

推荐 Conventional Commits：

```text
feat: add a user-visible capability
fix: correct runtime behavior
docs: update current documentation
refactor: change ownership or implementation structure
test: strengthen a current contract
chore: maintain tooling or dependencies
```

提交普通构建产物、IDE 私有文件或密钥前必须先清理。问题报告包含复现步骤、设备/模拟器信息、Node.js 与 AIoT Toolkit 版本、相关日志和预期行为，并移除账号、设备标识等敏感信息。