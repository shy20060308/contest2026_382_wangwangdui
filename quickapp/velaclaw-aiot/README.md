# vela_band

[English](docs/README_EN.md) | **简体中文**

`vela_band` 是面向 Xiaomi Vela Quick App 的可穿戴参考应用，当前版本 **3.0.0**。同一 RPK 面向 Pill / Circle / Rect 三类 wearable form factor；manifest 当前包含 **17 个 route**，全部页面使用 V3 Declarative Surface Runtime。

> 本项目用于比赛演示、架构验证和可穿戴 UI 探索，不是医疗软件。健康页面只展示真实 Capability/Domain 状态，能力不可用时明确显示未知或不可用，不生成伪健康数据。

## V3 唯一前端链

```text
Vela Native APIs → Capabilities → Domain → Feature Controllers
                                          ↓ semantic state/actions
Device Profile → Host Scene → page-local Surface JSON
                               ↓
                   Surface / Stage / Experience Runtime
                               ↓
                   generic Surface Host / Components
                               ↓
                         thin page UX
```

核心规则：Surface JSON 拥有模块顺序、静态文案、颜色、字号、间距、圆角、shape/face variants 与声明式动作；Feature 只处理业务语义；generic renderer 不识别具体页面；页面 UX 不拥有产品 DOM/style。构建生成的 metadata / Watchface preview 是 authored JSON 的派生产物，不是第二套手写真源。

详细 contract 见 [V3 Design Runtime](docs/ARCHITECTURE_V3.md)、[Frontend Authority](docs/V3_FRONTEND_AUTHORITY.md) 和 [维护者指南](docs/PROJECT_OWNER_GUIDE.md)。

## 当前功能

| 模块 | 实现 |
|---|---|
| 表盘 | Sport / Simple / Dashboard；Circle Mechanical；Pill Alpine；Watchface preview 从 Clock Stage 真源构建生成 |
| 应用入口 | Circle Honeycomb / Pill paged-list / Rect grid，保留各形态直接操作语义 |
| 健康 | 心率、血氧、压力与真实/不可用状态；recent window 不冒充日统计 |
| 活动与趋势 | 今日活动、最近 7 个自然日真实记录与 V4 持久化 |
| 运动 | 步行/跑步、暂停/继续、GPS、官方心率、稳定 finalized intent 与幂等完成记录 |
| Today | 今日摘要和月历 |
| 通知 | 通知/来电本地演示与震动反馈；当前不承诺远程挂断 ACK |
| 同步 | Interconnect 基础、lazy packet、发送进度；真实 peer ACK / Android companion 闭环仍待完成 |
| 设置 | 亮度、震动、动作诊断、设备能力诊断、存储恢复诊断 |
| Power | ACTIVE / DIM / ambient-like `SLEEP` 状态；内部名称不代表已测硬件睡眠或功耗收益 |

## 工程结构

```text
src/
├── capabilities/              # Vela 原生能力边界与结构化 storage 读写
├── domain/                    # canonical 业务状态、状态机、持久化
├── product/
│   ├── features/              # Feature Controllers
│   ├── design/                # 通用 Scene / Profile 辅助
│   └── frontend/
│       ├── surfaces/          # 17 个 route 的 authored Surface JSON
│       ├── runtime/           # 通用 Surface / Stage / Experience Runtime
│       └── generated/         # 构建派生 metadata / Watchface preview
├── runtime/                   # Page / Device / Navigation / Power / Haptics
├── components/                # 通用 Surface Host / Collection / Slider / Preview
├── pages/                     # thin Surface page shells
└── common/logo.png            # manifest 图标
```

## Manifest / 目标环境

`src/manifest.json` 当前声明：

- `minAPILevel: 2`
- `minPlatformVersion: 1000`
- `designWidth: 192`
- entry: `pages/clock`
- package: `com.application.watch.demo`（最终 release identity 尚未冻结）

赛事设备验收使用：

```text
vela-miwear-watch-5.0(开发者大赛)
```

审计计划要求 aiot-core / aiot-emulator 1.7.22+；最终记录实际安装版本。

## 开发

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

核心门禁示例：

```bash
npm run v3:architecture
npm run v3:design
npm run v3:surfaces
npm run v3:schema
npm run v3:frontend-contract
npm run v3:truth
```

`npm run check` 包含 strict frontend authority、schema/geometry、interaction/async ownership、storage/history/workout 等合同。源码检查和 QuickApp build 不能替代指定赛事镜像上的 RPK 安装、原生触摸、传感器、内存、FPS 和功耗验收。

## 验收资料

- [设备/模拟器验收清单](docs/DEVICE_ACCEPTANCE_CHECKLIST.md)
- [性能基线模板](docs/PERFORMANCE_BASELINE_TEMPLATE.md)
- [修复与证据索引](docs/EVIDENCE_INDEX.md)

最终 release 的 SHA、RPK hash、截图、性能样本和 smoke 结果应指向同一个冻结版本。

## Skill

当前项目提供两个待最终有效性验证的工作流：

- `skills/vela-surface-design/SKILL.md`
- `skills/vela-runtime-refactor/SKILL.md`

文件存在不等于赛事 Skill 验收完成；最终还需要用真实设计/重构任务执行并记录产物。

## 当前边界

Draft 审计分支已经有大量仓库级 correctness/geometry/build 证据，但以下内容仍不能从 CI 推断：

- 指定赛事镜像安装并实际启动自定义 RPK；
- F16 原生触摸/手势传播；
- Health/GPS 最终 freshness 与物理数据质量；
- native render/touch latency、内存回稳、FPS、功耗；
- Android companion 的真实 sync ACK；
- 最终包名/签名/release 产物与正式赛事提交状态。
