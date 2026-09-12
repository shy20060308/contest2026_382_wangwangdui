# V3 Validation Evidence

本文统一记录 V3 的仓库证据、构建证据与设备证据。不同证据类型不互相替代：行为测试证明业务规则，contract 证明边界，QuickApp build 证明构建链，目标设备记录证明安装、触摸、传感器、原生渲染、内存与功耗。

## 证据类型

| 类型 | 含义 |
|---|---|
| Behavior | 可执行 Domain / Runtime / Controller 行为测试 |
| Contract | schema、架构、ownership、geometry 等静态或确定性约束 |
| Build | 同一 source SHA 的 QuickApp/JSC build 或 release |
| Geometry | 确定性 shape/layout 计算，不等于原生截图或 hit test |
| Device | 指定赛事镜像或硬件上的安装、视觉、触摸、传感器和系统数据 |
| Peer | Android/peer 协议、业务 ACK 与对端持久化证据 |

## 当前产品证据映射

| 能力 | 仓库证据 |
|---|---|
| Workout 数据真实性与完成恢复 | `workout:truth`, `workout:experience` |
| Activity 跨日与持久化 | `activity:persistence`, `activity:rollover` |
| History 七自然日窗口 | `history:truth`, `history:calendar` |
| Health 官方数据与 recent window | `health:logic`, `health:official` |
| Health / Motion / Location 异步 owner | `async:ownership` |
| 页面 generation 与路由 ownership | `async:ownership`, `interaction:ownership` |
| Clock / overlay / notification | `clock:notification`, `v3:interaction-parity` |
| Device Profile 与三形态 | `device:profile`, `v3:adaptation` |
| Display / Power | `display:runtime`, `power:logic`, `power:runtime` |
| Slider / Settings | `interaction:ownership`, `settings:store` |
| Storage 队列、读效率与恢复 | `storage:queue`, `storage:reads`, `storage:recovery-core` |
| Sync packet / protocol | `sync:protocol` |
| Surface schema / geometry / authority | `v3:schema`, `v3:surfaces`, `v3:frontend-contract` |
| Watchface preview truth | `watchface:preview` |
| Copy / state payload ownership | `copy:ownership`, `state:payload`, `v3:truth` |
| Package hygiene | `v3:package-hygiene` |
| Runtime performance instrumentation | `v3:performance` |

## 架构事实

- Manifest 当前包含 17 个 product route。
- 17 个 route 与 17 份 authored Surface JSON 一一对应。
- 页面 UX 为 thin shell。
- `src/v2`、旧 presentation、页面专属 `product/design/apps` 和专属 watchface UX 不在当前源码树中。
- Circle Launcher 使用 Honeycomb，Pill 使用 paged list，Rect 使用 grid；形态差异由 Surface / adaptation contract 管理。
- Watchface preview 由 Clock Stage 设计真源构建派生。
- Surface runtime、engine、host 维持 generic ownership。
- 两个项目 Skill 位于 `skills/vela-surface-design/` 与 `skills/vela-runtime-refactor/`。

## 性能证据

仓库运行时提供以下 JS 侧指标：

- `surfaceSerializeAvgMs` / `surfaceSerializeMaxMs`
- `surfaceResolveAvgMs` / `surfaceResolveMaxMs`
- `surfaceDecorateAvgMs` / `surfaceDecorateMaxMs`
- `surfaceContextAvgMs` / `surfaceContextMaxMs`
- `surfaceJsAvgMs` / `surfaceJsMaxMs`
- `routeSurfaceReadyAvgMs` / `routeSurfaceReadyP50Ms` / `routeSurfaceReadyP95Ms` / `routeSurfaceReadyMaxMs`

这些字段用于定位 JS 侧成本，不直接作为 native FPS、RAM、触摸延迟或功耗数值。目标设备测量统一填写 [PERFORMANCE_BASELINE_TEMPLATE.md](PERFORMANCE_BASELINE_TEMPLATE.md)。

## Release 记录

| 项目 | 记录 |
|---|---|
| Source SHA |  |
| `npm ci` |  |
| `npm run check` |  |
| `npm run release` |  |
| RPK path |  |
| RPK SHA-256 |  |
| Required-image install log |  |
| Cold-launch log |  |
| Circle screenshot |  |
| Pill screenshot |  |
| Rect screenshot |  |
| Touch / gesture evidence |  |
| Health / GPS evidence |  |
| Performance baseline |  |
| Core smoke log |  |
| Peer / sync evidence |  |
| Skill design-task evidence |  |
| Skill refactor-task evidence |  |
| Demo video |  |
| AI Coding logs |  |
| Official repository PR / checks |  |

## 关联文档

- [设备验收](DEVICE_ACCEPTANCE_CHECKLIST.md)
- [性能基线](PERFORMANCE_BASELINE_TEMPLATE.md)
- [V3 架构](ARCHITECTURE_V3.md)
- [Frontend Authority](V3_FRONTEND_AUTHORITY.md)
- [维护者指南](PROJECT_OWNER_GUIDE.md)

所有 release 记录以同一 source SHA、RPK 和设备环境为关联键。