# V3 Page Frontend Audit Baseline

审计事实源：`src/manifest.json -> router.pages`。本表不是手工页面白名单；它记录当前迁移基线，真正的持续校验由 `scripts/audit-v3-frontends.js` 每次从 manifest 重新枚举。

当前结论：18 个路由页面均尚未达到 `V3_FRONTEND_AUTHORITY.md` 的最终标准。功能可用不等于前端权威已经收口。

| Route | Current UX | 主要前端权威问题 | 迁移重点 |
|---|---|---|---|
| `pages/clock` | `pages/clock/clock.ux` | UX 直接选择 Pill/Rect/Circle 表盘组件；表盘、通知、息屏覆盖层顺序和静态文案均在 UX；直接依赖旧 design/features | 表盘状态改为 JSON modules + generic watchface primitive；shape 只进入 JSON variant |
| `pages/clock_guard` | `pages/clock_guard/clock_guard.ux` | 虽很小，但导航定时逻辑、黑色 surface 仍由页面自身拥有；没有 Surface JSON | 用无可见 modules 的 host surface + controller action 表达 |
| `pages/heartrate` | `pages/heartrate/heartrate.ux` | 心率、血氧/压力双卡、两张趋势卡和 footer 的顺序硬编码；静态文案与 page style 在 UX；直接依赖 design/features | `header + metric-card + metric-pair + chart-card + chart-card + status` |
| `pages/steps` | `pages/steps/steps.ux` | 标题、趋势入口、指标列表结构和文案硬编码；直接依赖 design/features | `header + button/list entry + metric-list` |
| `pages/applist` | `pages/applist/applist.ux` | Honeycomb、paged-list、designed-grid 三套前端结构并存在 UX；分页视觉和静态文案在 UX；直接依赖 design/feature/engine | JSON variant 选择通用 `honeycomb/list/grid` primitive，UX 不再选 surface |
| `pages/notification_demo` | `pages/notification_demo/notification_demo.ux` | Demo 按钮栈与通知 overlay 完整手写；静态文案、颜色 fallback 在 UX；直接依赖 design/features | `header + button list + notification/status overlay` |
| `pages/history` | `pages/history/history.ux` | summary、trend、insight 三段顺序硬编码；compact-column/comparative-row 在 UX 分支；静态文案和 page style 在 UX | `header + metric-pair + chart-card + metric-list`，trend 表达方式由 variant/module props 决定 |
| `pages/workout_select` | `pages/workout_select/workout_select.ux` | continue/mode/history 卡片顺序和文案硬编码；直接依赖 design/features | `header + conditional button + list + button` |
| `pages/workout` | `pages/workout/workout.ux` | Header、状态 chip、hero、4 指标、操作区、确认弹层全部手写；确认文案在 UX；直接依赖 design/features | `header + status + metric-card + metric-list/grid + button group + confirmation status` |
| `pages/workout_history` | `pages/workout_history/workout_history.ux` | summary、empty state、record list 结构和单位文案硬编码；直接依赖 design/features | `header + metric-pair + status + list` |
| `pages/watchface` | `pages/watchface/index.ux` | Circle/Pill/Rect 三套 DOM 并存；预览时间、按钮、CURRENT 等静态 copy 在 UX；直接依赖 design/features | 一个 JSON surface，用 shape variants 配置 `watchface-preview/grid/list` primitives |
| `pages/settings/settings` | `pages/settings/settings/settings.ux` | 设置列表、pager、箭头和标题手写；直接依赖 design/view | `header + list + pager/status` |
| `pages/settings/bluetooth` | `pages/settings/bluetooth/bluetooth.ux` | 状态卡、按钮、同步进度、数据卡和说明 copy 全在 UX；直接依赖 sync design/features | `header + status + button pair + progress-card + metric-list + text` |
| `pages/settings/vibration` | `pages/settings/vibration/vibration.ux` | pageIndex 两套 panel、强度按钮、模式卡片和 copy 手写；大量视觉 fallback 在 private state | modules + visibleWhen；颜色、文案、模式外观进入 JSON，controller 只给状态 |
| `pages/settings/brightness` | `pages/settings/brightness/brightness.ux` | 状态卡、slider、自动亮度/抬腕/低功耗三卡和 copy 手写；颜色 fallback 在页面 | `header + status + slider + list/toggle rows` |
| `pages/settings/diagnostics` | `pages/settings/diagnostics/diagnostics.ux` | 设备档案和 capability 两页结构在 UX 分支；大量诊断说明文案在 UX | `header + metric-list + status/list + pager` |
| `pages/settings/motion` | `pages/settings/motion/motion.ux` | 实时三轴与动作测量两套 panel 在 UX；orb/countdown/action 结构及免责声明手写 | `header + metric-list + metric-pair + button group + status + text` |
| `pages/today` | `pages/today/today.ux` | 文件内直接维护 Circle/Pill/Rect 多套完整结构；日历/摘要模块、周标题、单位、按钮文案全部在 UX；直接依赖 design/features | 优先拆成统一 `summary` / `calendar` modules，所有 shape 差异只留 JSON variants |

## 共同违规模式

当前页面普遍存在四类结构债：

1. 页面 UX 直接 import Feature / Design / View；
2. UX template 决定产品模块顺序和 shape 分支；
3. 静态可见文案及颜色/样式 fallback 留在 UX；
4. `src/v2` 与复制后的 `src/product` 同时存在，形成双 namespace。

这些问题必须通过迁移消失，而不是通过改名或搜索结果掩盖。

## 迁移顺序

按风险分四批：

1. `heartrate`, `history`, `steps`：结构代表性强，且已在赛事 Pill 环境验证视觉基线；
2. `workout_select`, `workout`, `workout_history`, `today`：业务状态和复杂交互；
3. `settings/*`, `notification_demo`：重复卡片/表单 primitive 可收敛；
4. `applist`, `watchface`, `clock`, `clock_guard`：多 surface、表盘组件和应用入口最后收口。

每批完成后必须同时满足：普通业务测试不回归、`v3:frontend-audit` 对已迁移路由为 OK、赛事 beta RPK 能安装、用户核心页面 smoke test 通过。全部路由 OK 后才启用 strict contract 作为 `npm run check` 的强制门。
