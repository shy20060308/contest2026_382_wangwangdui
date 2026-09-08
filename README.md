# vela_band — openvela 2026 参赛作品

## 作品简介

`vela_band` 是面向 Xiaomi Vela Quick App 的智能手环 / 手表交互项目。当前 Quick App 工程版本为 **3.0.0**，在同一产品中支持 Pill / Circle / Rect 三类 wearable form factor，并围绕表盘、启动器、健康、活动趋势、运动、通知、Today、设置、同步和低功耗状态构建可验证的产品链。

当前重构采用 Recipe-first 的 V3 设计运行时。不同屏幕形态不是通过页面 CSS 自动缩放或运行时拟合得到，而是由 Device Profile 消费系统提供的 canonical `screenShape` 与物理尺寸，由 App Recipe 明确声明各形态的产品设计，再由 Adapter / Resolver 翻译成最终 Plan。复杂连续交互可以使用消费 resolved Plan 的 Product Math Engine，但 Engine 不拥有第二套静态视觉设计。

> 本项目用于比赛演示、架构验证和可穿戴 UI 探索，不是医疗软件或生产级设备固件。健康和运动正式表面只提升官方实时健康样本；能力不可用时保持等待或 unavailable，不用模拟趋势替代真实数据。

## 当前产品链

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
Adapter translation
      ↓
App Resolver
      ↓
Resolved Plan
      ↓
Optional Recipe-bound Product Math Engine
      ↓
UX / Watchface renderer
```

核心原则：一个事实只有一个 owner。Device Profile 验证系统提供的设备形态、物理尺寸与声明式 safe insets，不用宽高比猜形态；Recipe 拥有静态产品构图；Adapter 只翻译，不做拟合/扫描/视觉修复；Resolver 只组合确实依赖 Scene/Safe 的关系；UX 在 Plan 就绪后渲染，不保存第二套非零几何 fallback。

## 目录结构

```text
contest2026_382_wangwangdui/
├── quickapp/
│   └── velaclaw-aiot/
│       ├── src/
│       │   ├── capabilities/          # Vela 原生能力边界
│       │   ├── domain/                # 业务状态、状态机、持久化
│       │   ├── runtime/               # Device Profile / Page / Power 等 runtime
│       │   ├── v2/features/           # 当前 Feature Controllers（历史路径名）
│       │   ├── v2/design/             # 当前 V3 Scene / Recipe / Adapter / Resolver / Engine
│       │   ├── pages/                 # 产品页面
│       │   ├── components/watchfaces/ # Clock Recipe 驱动的表盘渲染器
│       │   └── common/                # 仅静态资源
│       ├── assets/                    # 可编辑图标与表盘源素材
│       ├── scripts/                   # 当前检查、资源生成、模拟器辅助脚本
│       ├── test/                      # 架构、业务与纯逻辑回归测试
│       └── docs/                      # V3 架构和维护文档
├── logs/                              # 赛事 AI Coding 日志目录
├── contest2026_382_wangwangdui.xml
└── README.md
```

`src/v2` 是当前源码中的历史路径名，不等于 V2 compatibility。`src/v2/app`、`src/v2/system`、旧 Design Specs / Views、Geometry solver、Presentation runtime 等兼容层已经退出当前代码树。

赛事 manifest 将本作品映射到：

```text
packages/apps/contest2026_382_velaclaw_aiot
```

## 主要实现

- **表盘**：Sport / Simple / Dashboard，以及 Circle Mechanical、Pill Alpine；父 Clock Recipe 把 resolved face layout 注入所有子表盘。
- **应用启动器**：Pill 分页列表、Rect 设计网格、Circle Honeycomb。Honeycomb 的 focus、spacing、icon expression 和 label 构图来自 Launcher Recipe；Engine 只负责 hex 数学与拖拽/惯性物理。
- **健康与活动**：心率、血氧、压力、今日活动和历史趋势；正式健康表面遵守 official-live provenance。
- **运动**：步行 / 跑步、暂停 / 继续、位置能力、官方心率和运动历史。
- **Today**：日期、农历、活动摘要和月历。
- **通知**：通知/来电状态演示与震动反馈。
- **设置与诊断**：亮度、震动、动作诊断、设备能力诊断和同步入口。
- **同步**：系统 Interconnect 连接状态、业务 payload、分包、发送进度与完成状态。
- **Power**：ACTIVE / DIM / SLEEP runtime 与显示、电量、健康采样编排。

更完整的当前实现说明见 `quickapp/velaclaw-aiot/README.md`、`quickapp/velaclaw-aiot/docs/ARCHITECTURE_V3.md` 和维护者指南。

## 构建与验证

需要 Node.js 18 或更高版本、npm、Vela JS 应用 Framework API Level 3+，以及 Xiaomi AIoT-IDE / Vela Quick App 开发环境。

```bash
cd quickapp/velaclaw-aiot
npm ci
npm run check
npm run build
```

也可以分别运行 V3 核心门禁：

```bash
npm run v3:architecture
npm run v3:design
npm run v3:truth
```

`npm run release` 是生产模式构建入口。是否已经获得可提交的 production RPK、签名结果以及模拟器/实机最终回归，应以开发者本地工具链的实际输出为准，仓库文档不预先宣称通过。

## 当前维护方向

当前阶段按以下顺序推进：

```text
产品
→ 验证跨形态设计理论
→ 总结稳定规律
→ 沉淀可复用 Skill / Design IR
→ 再做开发者友好工具
```

因此当前仓库优先保持一条可验证的产品运行链，不维护已经失去消费者的兼容桥、旧 solver、重复 validator 或第二套模板/布局规范。Git 历史负责保存被退役实现。

## AI Coding 与赛事材料

赛事要求的正式 AI Coding 日志应通过官方支持的采集流程生成并提交到 `logs/<github_login>/...`。作品介绍文档、Demo 视频、production RPK 等最终赛事材料应以实际提交状态为准，不在 README 中用未验证状态代替证据。

## 许可证与第三方素材

项目源代码按 Apache License 2.0 发布，详见 `quickapp/velaclaw-aiot/LICENSE`。第三方素材及生成资源的归属与适用条款见 `quickapp/velaclaw-aiot/NOTICE`。

## 免责声明

健康相关页面用于 Quick App 能力和交互演示，不构成医疗或健康判断。系统健康能力不可用时，正式产品表面保持 unavailable / 等待状态，不生成伪造健康趋势。