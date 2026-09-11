# vela_band

[English](docs/README_EN.md) | **简体中文**

`vela_band` 是面向 Xiaomi Vela Quick App 的可穿戴参考应用，当前版本 **3.0.0**。同一 RPK 支持 Pill / Circle / Rect 三类 wearable form factor；所有 manifest 页面统一使用 V3 Declarative Surface Runtime。

> 本项目用于比赛演示、架构验证和可穿戴 UI 探索，不是医疗软件。健康页面只展示真实 Capability/Domain 状态，能力不可用时明确显示未知或不可用，不生成伪健康数据。

## V3 唯一前端链

```text
Vela Native APIs → Capabilities → Domain → Feature Controllers
                                          ↓ semantic state/actions
Device Profile → Host Scene → Surface JSON → Surface Runtime → Surface Host → thin page UX
```

核心规则：Surface JSON 拥有模块顺序、静态文案、颜色、字号、间距、圆角和 Circle/Pill/Rect variants；Feature 只处理业务；generic renderer 不识别具体页面；页面 UX 不拥有产品 DOM/style。当前代码树不保留 `src/v2`、页面专属 `product/design/apps` 或专属 watchface UX。

详细 contract 见 [V3 Design Runtime](docs/ARCHITECTURE_V3.md)、[Frontend Authority](docs/V3_FRONTEND_AUTHORITY.md) 和 [维护者指南](docs/PROJECT_OWNER_GUIDE.md)。

## 当前功能

| 模块 | 实现 |
|---|---|
| 表盘 | Sport / Simple / Dashboard / Mechanical / Alpine，由 `clock.json` 的状态 modules/variants 表达 |
| 应用入口 | 单一声明式滚动入口，不保留 Honeycomb/分页列表的第二 renderer |
| 健康 | 心率、血氧、压力与真实样本趋势 |
| 活动与趋势 | 今日活动、7 日历史趋势与 V3 持久化 |
| 运动 | 步行/跑步、暂停/继续、位置、心率和运动历史 |
| Today | 今日摘要和月历 |
| 通知 | 本地/系统事件演示、来电与震动反馈 |
| 同步 | Interconnect 连接、分包发送和进度 |
| 设置 | 亮度、震动、同步、动作诊断、设备能力诊断 |
| Power | ACTIVE / DIM / SLEEP 与显示/传感器生命周期编排 |

## 工程结构

```text
src/
├── capabilities/              # Vela 原生能力边界
├── domain/                    # 业务状态、状态机、持久化
├── product/
│   ├── features/              # Feature Controllers
│   ├── design/                # 仅通用 Scene / Adapter
│   └── frontend/
│       ├── surfaces/          # 18 个 route 的唯一视觉 Surface JSON
│       └── runtime/           # 通用 Surface Runtime
├── runtime/                   # Page / Device / Navigation / Power / Haptics
├── components/surface_host.ux # 唯一产品 renderer
├── pages/                     # thin Surface page shells
└── common/logo.png            # manifest 图标
```

## 开发

要求 Node.js 18+、npm、AIoT-IDE/兼容 Vela Quick App 工具链和赛事要求的 Vela 目标环境。

```bash
npm ci
npm run check
npm run build
```

调试：

```bash
npm run start
```

核心门禁：

```bash
npm run v3:architecture
npm run v3:design
npm run v3:surfaces
npm run v3:frontend-contract
npm run v3:truth
```

`npm run check` 已直接包含 strict frontend authority contract。源码检查不能替代赛事 beta 镜像上的 RPK 安装和页面 smoke test；最终运行时结论以本地构建和目标设备/模拟器验证为准。
