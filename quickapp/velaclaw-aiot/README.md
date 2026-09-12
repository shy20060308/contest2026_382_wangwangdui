# vela_band

[English](docs/README_EN.md) | **简体中文**

`vela_band` 是面向 Xiaomi Vela Quick App 的可穿戴应用，当前版本 **3.0.0**。同一 RPK 覆盖 Circle、Pill、Rect 三类 wearable form factor；`src/manifest.json` 当前包含 **17 个 route**，17 个页面均通过 V3 Declarative Surface Runtime 运行，并与 authored Surface JSON 一一对应。

项目以人类可读的 Surface JSON 作为产品视觉与交互的设计真源。页面壳只负责生命周期与 action bridge；Feature / Domain / Capability 提供业务状态；通用 runtime、engine 和 UX 组件解释设计，不保存页面专属视觉决策。

> 健康、运动、传感器、电量和连接状态只使用真实 Capability / Domain 数据。能力没有提供有效数据时显示缺测、不可用或错误状态，不生成伪健康样本和伪运动数据。

## 产品能力

| 模块 | 实现 |
|---|---|
| Clock | Sport、Simple、Dashboard、Mechanical、Alpine 表盘；左右切换、上滑启动器、长按进入表盘选择；通知、来电和显示状态覆盖层 |
| Launcher | Circle Honeycomb、Pill 分页列表、Rect 网格，保留各形态直接操作方式 |
| Health | 心率、血氧、压力、最近样本窗口、可用性与时间状态 |
| Activity / History | 今日活动、跨日归档、最近 7 个自然日窗口、缺测状态和持久化恢复 |
| Workout | 步行/跑步、暂停/继续、GPS、实时心率、完成记录、幂等恢复与运动历史 |
| Today | 今日摘要与月历 |
| Notification | 通知与来电演示、覆盖层交互优先级和震动反馈 |
| Sync | Interconnect 连接、分包传输、进度、失败状态与重试 |
| Settings | 亮度、自动亮度、抬腕、震动、同步、动作诊断、设备与存储诊断 |
| Power | ACTIVE / DIM / ambient-like 显示策略与页面、定时器、传感器生命周期协调 |

## V3 架构

```text
Vela Native APIs
      ↓
Capabilities → Domain → Feature Controllers
                            ↓ semantic state/actions
Device Profile → Host Scene → Surface JSON
                            ↓
                 Surface / Stage / Experience Runtime
                            ↓
                  Generic Surface Host / Components
                            ↓
                       Thin Page Shell
```

核心约束：

- `src/manifest.json` 是 route 事实源。
- `src/product/frontend/surfaces/*.json` 拥有静态文案、visual token、模块结构、binding、action、shape variant 和 experience 选择。
- `src/product/frontend/adaptation-policy.json` 声明 L1 shared-expression、L2 local-expression、L3 independent-surface 的适配深度。
- Circle / Pill / Rect 不被强制做成同一种布局；L3 Surface 可以选择通用 experience/engine，例如 Honeycomb。
- `src/product/frontend/runtime/*`、`src/product/frontend/engines/*` 与 `src/components/*` 只实现通用 primitive、composition 和交互算法，不包含 route-specific 产品视觉。
- `src/pages/**/*.ux` 保持 thin shell，不拥有产品 DOM、视觉 token 或业务状态机。
- 当前源码不保留 `src/v2`、旧 presentation、页面专属 `product/design/apps` 或专属 watchface UX 树。

详细约束见 [V3 架构](docs/ARCHITECTURE_V3.md)、[Frontend Authority](docs/V3_FRONTEND_AUTHORITY.md) 和 [维护者指南](docs/PROJECT_OWNER_GUIDE.md)。

## 工程结构

```text
quickapp/velaclaw-aiot/
├── src/
│   ├── capabilities/              # Vela 原生能力边界
│   ├── domain/                    # canonical 业务状态、状态机、持久化
│   ├── product/
│   │   ├── features/              # Feature Controllers
│   │   ├── design/                # 通用 Scene / Adapter
│   │   └── frontend/
│   │       ├── surfaces/          # 17 个 route 的 authored Surface JSON
│   │       ├── runtime/           # 通用 Surface / Stage / Experience Runtime
│   │       ├── engines/           # 通用 L3 交互算法
│   │       └── generated/         # 构建派生 metadata / preview
│   ├── runtime/                   # Page / Device / Navigation / Power / Haptics
│   ├── components/                # 通用 Surface Host / Collection / Slider / Preview
│   ├── pages/                     # thin page shells
│   └── common/                    # manifest 图标与静态资源
├── scripts/                       # Surface 编译、审计和文档检查
├── test/                          # 行为、架构、持久化和交互合同
├── docs/                          # 架构、维护、验收、性能与证据
└── skills/                        # 可复用 AI Coding Skill
    ├── vela-surface-design/
    └── vela-runtime-refactor/
```

## 目标环境

`src/manifest.json` 当前声明：

```text
package: com.application.watch.demo
minAPILevel: 2
minPlatformVersion: 1000
designWidth: 192
entry: pages/clock
```

赛事设备验收使用指定镜像：

```text
vela-miwear-watch-5.0(开发者大赛)
```

工具链使用 aiot-core / aiot-emulator 1.7.22+，实际验收版本记录在设备验收文档中。

## 开发与构建

要求 Node.js 18+、npm、AIoT-IDE / Vela Quick App 工具链。

```bash
npm ci
npm run check
npm run build
```

调试：

```bash
npm run start
```

Release：

```bash
npm run release
```

核心 V3 门禁：

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

`npm run check` 同时覆盖 capability、device profile、interaction/async ownership、storage、sync、power、health、history、workout、activity、settings、motion、haptics 和 calendar 合同。

## Skill

项目 Skill 独立位于 `skills/`，不放在 `docs/`：

- [`vela-surface-design`](skills/vela-surface-design/SKILL.md)：设计新页面/表盘、修改 Surface JSON、视觉层级与 Circle/Pill/Rect 适配。
- [`vela-runtime-refactor`](skills/vela-runtime-refactor/SKILL.md)：正确性修复、生命周期/资源所有权、持久化、协议、重构与性能优化。

两个 Skill 都以当前仓库的 Surface authority、真实数据、不变量和验证链为约束，并各自携带所需 references / fixtures。

## 验收与性能

设备、性能和 release 证据统一记录在：

- [设备验收](docs/DEVICE_ACCEPTANCE_CHECKLIST.md)
- [性能基线](docs/PERFORMANCE_BASELINE_TEMPLATE.md)
- [验证证据](docs/EVIDENCE_INDEX.md)

源码 contract、QuickApp build、确定性几何检查和 JS 计时分别记录为对应证据类型；需要目标设备实际测量的数值只在同一 source SHA / RPK 上填写。