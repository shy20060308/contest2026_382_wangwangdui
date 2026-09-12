# vela_band

[English](docs/README_EN.md) | **简体中文**

`vela_band` 是面向 Xiaomi Vela Quick App 的可穿戴参考应用。V2.5 延续 V2.4 的工程基础，重点优化多形态设计、系统能力接入、运行时生命周期、真实数据边界与开发工具链，在同一应用中覆盖胶囊、圆形和矩形屏幕。

项目面向比赛演示、可穿戴交互研究和工程实践，不是医疗软件。健康数据只在系统能力提供可信样本时进入对应界面；能力不可用或样本尚未到达时，界面应明确等待或降级，不把兼容值包装成真实健康结果。

## 产品能力

| 领域 | 实现 |
| --- | --- |
| 表盘 | 多表盘切换与持久化，机械表盘、运动表盘、简洁表盘与形态专用构图 |
| 应用启动器 | Circle 与 Rect 使用蜂巢交互，Pill 使用纵向分页列表 |
| 健康 | 心率、血氧、压力等系统健康数据接入，来源状态与等待状态可见 |
| 活动与趋势 | 步数、热量、站立等日常指标，七日趋势使用真实持久化记录 |
| 运动 | 步行与跑步、暂停继续、会话恢复、位置距离、官方心率与历史记录 |
| 今日 | 日期、日历、健康摘要，并按屏幕形态调整信息密度 |
| 通知 | 来电、短信和应用通知的界面演示与事件入口 |
| 同步 | 业务 payload、分包、ACK、进度管理和可替换的传输边界 |
| 设置 | 亮度、震动、动作诊断、同步入口和设备信息 |
| 功耗 | ACTIVE、DIM、SLEEP 状态及资源释放策略 |

`src/manifest.json` 注册 20 个页面路由，并声明 router、device、battery、brightness、sensor、geolocation、vibrator、event、interconnect、storage 和 health 等系统能力。

## V2.5 架构

```text
Vela Native APIs
      ↓
Capability Adapters
      ↓
Domain State and Persistence
      ↓
Feature Controllers
      ↓
Design Specs and Design Views
      ↓
Shape-aware Scene and Adapter
      ↓
Vela Pages
```

V2.5 没有为版本名称做无意义的源码搬迁，因此核心目录仍保留 `src/v2`。这一目录承载应用运行时、Feature、Design 与设备系统抽象；顶层 `src/capabilities` 和 `src/domain` 分别负责原生能力边界与业务状态。

核心原则是让业务语义共享，让形态差异停留在设计层：

- **Capability** 只负责系统 API 与明确降级。
- **Domain** 保存与设备形态无关的业务事实。
- **Feature** 管理页面级状态、生命周期与资源所有权。
- **Design** 决定 Circle、Pill、Rect 的构图、几何和显示语义。
- **Page** 负责 Vela 生命周期与事件绑定，不重复业务计算。

详细说明见 [架构](docs/ARCHITECTURE.md)。

## 多形态设计

V2.5 不把可穿戴适配理解为统一缩放，而是把界面差异分成三个自由度：

- **L1 Auto**：普通设置、简单列表和常规控件，由设计规则自动解析安全尺寸与节奏。
- **L2 Assisted**：健康、趋势、运动等共享业务语义，但允许不同形态采用不同信息构图。
- **L3 Free**：表盘与蜂巢启动器等高视觉、高交互界面，允许形态拥有独立 Surface。

设计系统同时区分完整 Scene 与安全内容区。背景可以铺满物理外形，文字、数值和交互控件则按圆弧、胶囊端部和手势区域约束。这样可以避免为了“安全”把整页缩成小矩形，也减少圆屏黑边和胶囊屏有效空间浪费。

设计规则见 [设计系统](docs/DESIGN_SYSTEM.md)。

## 技术创新

V2.5 的创新点来自代码中已经存在的工程能力，而不是单独增加概念层：

1. **语义共享、形态原生的单应用架构**：同一 Domain 和 Feature 支撑 Circle、Pill、Rect，不强迫三个形态共享一套构图。
2. **设计自由度模型**：L1/L2/L3 把“可自动适配”和“需要产品设计”的边界显式化，避免响应式规则无限膨胀。
3. **Design Spec 与 Design View 分离**：几何计划和显示语义在设计层集中管理，页面保持轻量，降低跨页面复制计算的风险。
4. **真实运行逻辑驱动的 Layout Studio**：本地设计工具复用项目 Scene 与 Adapter 语义，并把形态差异保存回受控的布局配置，而不是维护第二套预览算法。
5. **数据来源可追踪**：健康与运动心率保留来源语义；没有官方样本时使用等待状态，不把模拟值写成真实结果。
6. **可穿戴生命周期治理**：健康订阅、定位、计时器、动作传感器等资源随页面和运动状态启停，减少后台资源泄漏。
7. **面向约束的质量门禁**：除 lint 外，还覆盖 Scene、架构、交互、设计视图、适配器、健康数据、运动体验、持久化、功耗、触觉、文本适配和页面 bundle 预算。

更多背景和可核验路径见 [创新设计](docs/INNOVATIONS.md)。

## 快速开始

需要 Node.js 18 或更高版本，以及可用的 Xiaomi Vela Quick App 开发环境。

```bash
npm ci
npm run check
npm run build
```

开发模式：

```bash
npm run start
```

发布构建：

```bash
npm run release
```

布局辅助工具：

```bash
npm run studio
```

Studio 的使用方式和安全边界见 [Layout Studio](docs/LAYOUT_STUDIO.md)。

## 质量检查

`npm run check` 汇总项目的静态和纯逻辑门禁，包括：

- JavaScript 与 UX lint；
- Scene、架构、Runtime、视觉和交互契约；
- Design View、Design System 与 Declarative Adapter；
- Capability Runtime、功耗、健康、运动、活动持久化与设置存储；
- Motion、Haptics、Calendar、Analog、Honeycomb；
- 文本适配和 Markdown 本地链接检查。

页面 bundle 可单独审计：

```bash
npm run bundle:audit
```

静态门禁不能替代 Vela Runtime 的模拟器或设备 smoke test。涉及手势、绝对定位、系统能力、资源生命周期和形态专用构图的改动必须补充运行环境验证。

## 项目结构

```text
quickapp/velaclaw-aiot/
├── src/
│   ├── capabilities/       # Vela 系统能力适配
│   ├── domain/             # 业务状态、持久化与状态机
│   ├── v2/
│   │   ├── app/            # 应用运行时与导航
│   │   ├── features/       # Feature Controller
│   │   ├── design/         # Scene、Adapter、Spec、View 与布局配置
│   │   └── system/         # 设备 Profile 与系统抽象
│   ├── pages/              # Vela 页面与生命周期绑定
│   └── components/         # 可复用组件
├── tools/layout-studio/    # 本地布局辅助工具
├── scripts/                # 构建、检查和模拟器辅助脚本
├── test/                   # 契约与纯逻辑测试
├── docs/                   # 长期维护文档
├── package.json
├── LICENSE
└── NOTICE
```

`src/common` 与 `src/presentation` 仍包含历史兼容代码或资源。新增能力应优先沿 Capability → Domain → Feature → Design → Page 链路扩展，避免重新把业务逻辑散回页面或旧公共模块。

## 文档

- [Architecture](docs/ARCHITECTURE.md)
- [Design System](docs/DESIGN_SYSTEM.md)
- [Innovations](docs/INNOVATIONS.md)
- [Layout Studio](docs/LAYOUT_STUDIO.md)
- [Workout and Sync](docs/WORKOUT_AND_SYNC.md)
- [Compatibility](docs/COMPATIBILITY.md)
- [Contributing](CONTRIBUTING.md)

## 许可证

源代码按 Apache License 2.0 发布，详见 [LICENSE](LICENSE)。第三方素材和生成资源的归属说明见 [NOTICE](NOTICE)。
