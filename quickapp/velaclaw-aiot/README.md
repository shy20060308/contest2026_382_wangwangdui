# vela_band

[English](docs/README_EN.md) | **简体中文**

`vela_band` 是面向 Xiaomi Vela Quick App 的智能手环/手表参考应用。当前工程版本为 **3.0.0**，使用 Recipe-first 的 V3 设计运行时，在同一 RPK 中支持 Pill / Circle / Rect 三类 wearable form factor。

> 本项目用于比赛演示、架构验证和可穿戴 UI 探索，不是医疗软件或生产级设备固件。健康页面只把官方实时健康样本提升为正式可见数据；能力不可用时必须明确表现等待或不可用状态，不得伪造健康趋势。

## V3 架构

当前产品链只有一条：

```text
Vela Native APIs
      ↓
Capabilities
      ↓
Domain / State Machines
      ↓
Feature Controllers
      ↓
Device Profile + Host Scene
      ↓
App Recipe
      ↓
V3 Adapter translation
      ↓
App Resolver
      ↓
Resolved Plan
      ↓
Optional Recipe-bound Product Math Engine
      ↓
UX / Watchface renderer
```

核心约束：

- Capability 封装原生 Vela API 和设备能力边界，并负责原生值的一次规范化。
- Domain 持有业务模型、状态机和持久化语义，不持有屏幕几何。
- Feature Controller 负责编排生命周期和业务流程，不拥有产品布局，也不重复修正 canonical Domain/Capability 数据。
- `src/runtime/device_profile.js` 是物理设备事实的验证边界；Scene 只负责设计坐标投影。
- Recipe 拥有页面/表盘的视觉意图、几何、字号、间距、形态差异和视觉约束。
- Adapter 只翻译 Recipe，不扫描、缩放、clamp、拟合或发明几何。
- Resolver 只组合无法直接静态表达的 Recipe 数据，不修复 Recipe。
- Product Math Engine 只在确有连续几何/交互数学时使用，必须消费 resolved Recipe/Plan；可以拥有惯性、阻尼、overscroll 等交互物理，但不能持有第二套 focus/icon/label 静态设计。
- UX 在 resolved plan 就绪后渲染，不保留私有非零几何 fallback。
- 同一个事实只允许一个 owner 和一次规范化；下游消费 canonical 数据，不重复验证或静默兜底。
- `src/common` 仅保留静态资源；运行时逻辑不得重新放回 common。

架构细节见 [V3 Design Runtime](docs/ARCHITECTURE_V3.md) 和 [维护者指南](docs/PROJECT_OWNER_GUIDE.md)。

## 当前功能

| 模块 | 当前实现 |
| --- | --- |
| 表盘 | Sport / Simple / Dashboard，以及 Circle Mechanical、Pill Alpine；表盘布局由 Clock Recipe 控制 |
| 应用启动器 | Circle 蜂巢、Pill 分页列表、Rect 设计网格；Honeycomb Engine 由 resolved Launcher Recipe 配置 |
| 健康 | 心率、血氧、压力与窗口趋势；只接受官方 live 数据并保留来源状态 |
| 活动与趋势 | 今日活动、7 日历史趋势与 V3 持久化 |
| 运动 | 步行/跑步、暂停/继续、官方心率、位置能力、运动历史 |
| Today | 日期、农历、活动摘要和月历 |
| 通知 | 本地/系统事件演示、来电状态和震动反馈 |
| 同步 | 业务 payload、分包、ACK、进度和明确标识的模拟 transport |
| 设置 | 亮度、震动、同步、动作诊断和设备能力诊断 |
| Power | ACTIVE / DIM / SLEEP runtime 与亮度、心率、电量编排 |

## 工程结构

```text
src/
├── capabilities/          # Vela 原生能力网关与原生数据规范化边界
├── domain/                # 业务状态、状态机、持久化
├── runtime/               # Page/Navigation/Device/Profile/Haptics/Power 等正式运行时
├── v2/
│   ├── features/          # 当前 Feature Controllers（历史路径名）
│   └── design/            # 当前 V3 Scene / Recipe / Adapter / Resolver / View / Engine
├── pages/                 # 产品页面，仅绑定 plan、feature state 和交互
├── components/watchfaces/ # 表盘渲染组件，布局由 Clock Recipe 注入
└── common/                # 仅静态图片、图标和表盘资源
```

`src/v2` 是当前源码中的历史路径名，不代表运行时继续兼容 V2。`src/v2/app`、`src/v2/system`、旧 Design Specs、Design Views、Geometry solver 和 Presentation runtime 已退出当前代码树。

当前阶段不维护 Layout Studio/模板工具。未来若重新引入开发者工具，应直接消费成熟的 V3 Recipe/IR 与单一 Validator，而不是复制 Profile、Recipe 字段、mock 数据或 Adapter 规则。

## 开发与检查

要求：

- Node.js 18+
- npm
- AIoT-IDE 或兼容的 Vela Quick App 工具链
- 可用的 Vela 模拟器/设备

安装依赖并运行完整门禁：

```bash
npm ci
npm run check
```

构建调试 RPK：

```bash
npm run build
```

开发 watch 模式：

```bash
npm run start
```

V3 设计相关门禁：

```bash
npm run v3:architecture
npm run v3:design
npm run v3:truth
```

`v3:architecture` 验证 retired runtime/compatibility 层没有重新出现、`src/common` 没有运行时逻辑、产品路由均进入 strict Recipe ownership，并检查依赖可解析。`v3:design` 验证当前设计在 Circle / Pill / Rect profile 上可解析。`v3:truth` 防止伪遥测、静默 catalog fallback 和隐藏默认 ownership 回归。

## V3 设计与数据规则

1. 不恢复 `src/presentation`、`src/v2/app` 或 `src/v2/system`。
2. 不恢复 `src/v2/design/specs`、`src/v2/design/views` 或 `geometry.js`。
3. 不通过组件宽度重新计算 safe area。
4. 不在 Adapter/Resolver/UX 中做 circle chord fitting、Y 扫描、自动缩放或运行时几何修复。
5. 页面 CSS 不拥有产品非零几何；几何必须来自 resolved Recipe。
6. 页面在 Recipe plan 就绪前不渲染产品 geometry。
7. Full-bleed scene 与 safe content 分离。
8. Product Math Engine 必须由 resolved Recipe/Plan 配置，不得成为第二套静态视觉 owner 或适配 solver。
9. Feature / Domain / Capability 逻辑不得因为视觉迁移重新塞回页面。
10. 健康和运动正式表面不得伪造系统健康数据；未知值保持 `null`/unavailable 直到 View 显示为 `--`。
11. 一个值只在其 owner 边界规范化一次；不要在 Capability、Domain、Feature、View 连续 Number/clamp/normalize。
12. 旧持久化 schema 不通过长期兼容代码修补；破坏性 V3 迁移使用干净 namespace，历史实现由 Git 保存。
13. 未来工具或模板不得成为第二套 Recipe/Adapter/Device Profile 规范。

## 说明

当前重构分支的质量结论应以开发者本地执行 `npm run check` 和实际 Vela 构建/模拟器回归为准。仓库内的架构测试用于阻止旧设计运行时、隐藏 fallback、重复 ownership 和兼容层重新进入产品链。