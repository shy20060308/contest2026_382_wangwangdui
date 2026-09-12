# vela_band — openvela 2026 参赛作品

## 作品简介

`vela_band` 是面向 Xiaomi Vela Quick App 的智能手环 / 手表交互项目。当前 Quick App 工程版本为 **3.0.0**，同一产品支持 Pill / Circle / Rect 三类 wearable form factor，覆盖表盘、启动器、健康、活动趋势、运动、通知、Today、设置、同步与显示策略等产品链。

当前 V3 架构以**人类可读 Surface JSON 为唯一 authored 视觉真源**。页面只加载自己的 Surface；Controller 输出语义状态和动作；通用 Surface Runtime / Host 负责解析与渲染。Circle、Pill、Rect 可以按 L1/L2/L3 规则采用不同几何或独立交互表达，但不会在 generic runtime 里再维护一套页面专属视觉真源。

> 本项目用于比赛演示、架构验证和可穿戴 UI 探索，不是医疗软件或生产级设备固件。健康和运动正式页面只展示可确认的数据来源；能力不可用时显示 unavailable/等待，不用模拟数字冒充实测数据。

## 当前产品链

```text
Vela Native APIs
      ↓
Capabilities
      ↓
Domain / State Machines / Persistence
      ↓
Feature Controllers
      ↓ semantic state + actions
Page-local Surface JSON
      ↓
Device Profile + Host Scene
      ↓
Generic Surface Runtime / Experience Runtime
      ↓
Generic Surface Host / Components
      ↓
thin page UX
```

关键原则：

- Surface JSON 拥有静态文案、视觉 token、模块顺序、shape/face variant 与声明式 action。
- Domain / Controller 只拥有业务事实、状态机和语义动作，不拥有页面颜色、文案和形态布局。
- Device Profile 允许在系统 shape 未返回时做 provisional 推断，但明确 native shape 到达后必须纠正仍存活页面。
- 运行时不把 authored geometry 错误偷偷 clamp 到屏内；Circle/Pill 遮罩与关键点击框在构建期检查，最终仍需设备截图/命中验证。
- CI / QuickApp build 只证明仓库 contract 与构建，不等于赛事镜像安装、原生触摸、FPS、RAM 或功耗验收。

## 当前工程结构

```text
contest2026_382_wangwangdui/
├── quickapp/
│   └── velaclaw-aiot/
│       ├── src/
│       │   ├── capabilities/          # Vela 原生能力边界
│       │   ├── domain/                # canonical 业务状态、状态机、持久化
│       │   ├── product/
│       │   │   ├── features/          # Feature Controllers
│       │   │   ├── design/            # 通用 Scene/Profile 相关设计逻辑
│       │   │   └── frontend/
│       │   │       ├── surfaces/      # 17 routes 的 authored Surface JSON
│       │   │       ├── runtime/       # 通用 Surface/Stage/Experience runtime
│       │   │       └── generated/     # 构建生成的元数据/派生 preview，不是手写真源
│       │   ├── runtime/               # Page / Device / Navigation / Power / Haptics
│       │   ├── components/            # 通用 Surface / Collection / Slider 等组件
│       │   ├── pages/                 # thin page shells
│       │   └── common/                # manifest 图标等静态资源
│       ├── scripts/                   # Surface compile、审计和文档检查
│       ├── test/                      # 架构、行为、持久化和交互回归
│       ├── docs/                      # 架构、验收、性能和证据文档
│       └── skills/                    # 项目 Skill 工作流（需在最终提交前完成有效性验收）
├── logs/                              # 正式 AI Coding 日志目录（仅真实采集）
├── contest2026_382_wangwangdui.xml
└── README.md
```

赛事 manifest 将本作品映射到：

```text
packages/apps/contest2026_382_velaclaw_aiot
```

## 当前功能

- **表盘**：Sport / Simple / Dashboard；Circle 额外支持 Mechanical，Pill 额外支持 Alpine。Watchface selector 的预览由 Clock Stage 真源在构建期生成，不再用固定假时间模板。
- **应用启动器**：Circle Honeycomb、Pill 分页列表、Rect 网格，继续保留各形态已接受的直接操作方式。
- **健康与活动**：心率、血氧、压力、今日活动和最近自然日历史；正式状态不制造健康样本。
- **运动**：步行 / 跑步、暂停 / 继续、GPS 距离、官方实时心率、稳定完成记录与恢复语义。
- **Today**：日期、活动摘要和月历。
- **通知**：通知/来电演示与震动反馈；当前来电结束动作明确是本地演示，不宣称远程电话 ACK。
- **设置与诊断**：亮度、震动、动作诊断、设备能力诊断、五类持久化状态与显式 quarantine/reset 恢复入口。
- **同步**：Interconnect 连接和 lazy packet 发送基础；真实对端业务 ACK / Android companion 闭环仍属于待完成项，不能只凭发送成功宣称同步完成。
- **显示策略**：ACTIVE / DIM / 内部 ambient-like `SLEEP` 状态；内部命名不等于已经证明硬件睡眠或功耗收益。

## 构建与验证

`src/manifest.json` 当前声明 `minAPILevel: 2`、`minPlatformVersion: 1000`、`designWidth: 192`。开发需要 Node.js 18+、npm 与 Xiaomi AIoT-IDE / Vela Quick App 工具链。

赛事验收使用指定镜像：

```text
vela-miwear-watch-5.0(开发者大赛)
```

项目审计计划要求 aiot-core / aiot-emulator 使用 1.7.22+；最终以本地实际工具版本和赛事最新要求记录为准。

```bash
cd quickapp/velaclaw-aiot
npm ci
npm run check
npm run build
```

`npm run release` 是 release 构建入口。最终 production RPK、签名、安装、覆盖升级与冷启动结果必须以冻结 SHA 的真实工具链输出为准。

## 验收与证据

工程内提供：

- `docs/DEVICE_ACCEPTANCE_CHECKLIST.md` — 指定赛事镜像上的安装、三形态、触摸、持久化、传感器与 smoke 验收。
- `docs/PERFORMANCE_BASELINE_TEMPLATE.md` — 冷启动、route p50/p95、native render/touch、内存回稳与功耗测量模板。
- `docs/EVIDENCE_INDEX.md` — F 编号修复、CI/build 与待设备/对端证据索引。

仓库中的 deterministic geometry、plan primitive 和 JS `surface*Ms` 指标都不是 native FPS/RAM/功耗结论。

## AI Coding 与 Skill

赛事正式 AI Coding 日志必须由官方支持的采集流程真实生成并提交；本 README、PR 描述或普通对话不能代替正式日志，也不补造日志。

项目正在沉淀：

- `skills/vela-surface-design/SKILL.md`
- `skills/vela-runtime-refactor/SKILL.md`

Skill 文件存在本身不代表赛事有效性验收完成；最终还需要用真实任务运行、保留产物和证据。

## 当前发布边界

当前审计分支仍是 Draft PR，不应仅因为 CI 绿色就合入发布分支。仍需完成赛事镜像安装/启动、原生触摸与传感器验证、性能基线、同步/对端最终范围、包名/签名/release RPK、介绍材料与正式提交状态核对。

## 许可证与第三方素材

项目源代码按 Apache License 2.0 发布，详见 `quickapp/velaclaw-aiot/LICENSE`。第三方素材及生成资源的归属与适用条款见 `quickapp/velaclaw-aiot/NOTICE`。

## 免责声明

健康相关页面用于 Quick App 能力和交互演示，不构成医疗或健康判断。系统健康能力不可用时，正式产品页面保持 unavailable / 等待状态，不生成伪造健康趋势。