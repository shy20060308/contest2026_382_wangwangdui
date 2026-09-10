# V3 Page Frontend Audit Baseline

审计事实源：`src/manifest.json -> router.pages`。本表不是手工页面白名单；它记录当前迁移基线，真正的持续校验由 `scripts/audit-v3-frontends.js` 每次从 manifest 重新枚举。

当前结论：18 个路由中，`pages/steps` 已完成第一张 JSON 唯一前端迁移；其余 17 个页面仍处于迁移前/过渡状态。功能可用不等于前端权威已经收口。

| Route | 状态 | 主要前端权威问题 / 已完成事项 | 迁移重点 |
|---|---|---|---|
| `pages/clock` | Pending | UX 直接选择 Pill/Rect/Circle 表盘组件；表盘、通知、息屏覆盖层顺序和静态文案均在 UX；直接依赖旧 design/features | 表盘状态改为 JSON modules + generic watchface primitive；shape 只进入 JSON variant |
| `pages/clock_guard` | Pending | 虽很小，但导航定时逻辑、黑色 surface 仍由页面自身拥有；没有 Surface JSON | 用无可见 modules 的 host surface + controller action 表达 |
| `pages/heartrate` | Pending | 心率、血氧/压力双卡、两张趋势卡和 footer 的顺序硬编码；静态文案与 page style 在 UX；直接依赖 design/features | `header + metric-card + metric-pair + chart-card + chart-card + status` |
| `pages/steps` | **Migrated** | `steps.json` 唯一拥有模块顺序、文案、颜色、尺寸和 Circle/Pill/Rect override；UX 只绑定 `surface_host` + `surface_page`；旧 `product/design/apps/steps` 与 `v2/design/apps/steps` 已删除 | 保持 staged gate、runtime test 与赛事设备 smoke test |
| `pages/applist` | Pending | Honeycomb、paged-list、designed-grid 三套前端结构并存在 UX；分页视觉和静态文案在 UX；直接依赖 design/feature/engine | JSON variant 选择通用 `honeycomb/list/grid` primitive，UX 不再选 surface |
| `pages/notification_demo` | Pending | Demo 按钮栈与通知 overlay 完整手写；静态文案、颜色 fallback 在 UX；直接依赖 design/features | `header + button list + notification/status overlay` |
| `pages/history` | Pending | summary、trend、insight 三段顺序硬编码；compact-column/comparative-row 在 UX 分支；静态文案和 page style 在 UX | `header + metric-pair + chart-card + metric-list`，trend 表达方式由 variant/module props 决定 |
| `pages/workout_select` | Pending | continue/mode/history 卡片顺序和文案硬编码；直接依赖 design/features | `header + conditional button + list + button` |
| `pages/workout` | Pending | Header、状态 chip、hero、4 指标、操作区、确认弹层全部手写；确认文案在 UX；直接依赖 design/features | `header + status + metric-card + metric-list/grid + button group + confirmation status` |
| `pages/workout_history` | Pending | summary、empty state、record list 结构和单位文案硬编码；直接依赖 design/features | `header + metric-pair + status + list` |
| `pages/watchface` | Pending | Circle/Pill/Rect 三套 DOM 并存；预览时间、按钮、CURRENT 等静态 copy 在 UX；直接依赖 design/features | 一个 JSON surface，用 shape variants 配置 `watchface-preview/grid/list` primitives |
| `pages/settings/settings` | Pending | 设置列表、pager、箭头和标题手写；直接依赖 design/view | `header + list + pager/status` |
| `pages/settings/bluetooth` | Pending | 状态卡、按钮、同步进度、数据卡和说明 copy 全在 UX；直接依赖 sync design/features | `header + status + button pair + progress-card + metric-list + text` |
| `pages/settings/vibration` | Pending | pageIndex 两套 panel、强度按钮、模式卡片和 copy 手写；大量视觉 fallback 在 private state | modules + visibleWhen；颜色、文案、模式外观进入 JSON，controller 只给状态 |
| `pages/settings/brightness` | Pending | 状态卡、slider、自动亮度/抬腕/低功耗三卡和 copy 手写；颜色 fallback 在页面 | `header + status + slider + list/toggle rows` |
| `pages/settings/diagnostics` | Pending | 设备档案和 capability 两页结构在 UX 分支；大量诊断说明文案在 UX | `header + metric-list + status/list + pager` |
| `pages/settings/motion` | Pending | 实时三轴与动作测量两套 panel 在 UX；orb/countdown/action 结构及免责声明手写 | `header + metric-list + metric-pair + button group + status + text` |
| `pages/today` | Pending | 文件内直接维护 Circle/Pill/Rect 多套完整结构；日历/摘要模块、周标题、单位、按钮文案全部在 UX；直接依赖 design/features | 优先拆成统一 `summary` / `calendar` modules，所有 shape 差异只留 JSON variants |

## 已迁移页面的硬条件

一个路由只有同时满足下面这些条件才标记为 Migrated：

1. manifest route 对应且只对应一个 `src/product/frontend/surfaces/*.json`；
2. JSON 拥有模块顺序、静态文案、视觉 token 和 shape variants；
3. page UX 只允许依赖 `surface_host.ux` 与 `surface_page.js`，不得直连 Design / Feature / Domain / Capability；
4. generic runtime/renderer 不得包含该 route、surface id、controller id 的特判，也不得保存页面视觉常量；
5. 该页面原有 Design Resolver / Layout / View 必须退役，不能留下第二套可编辑视觉权威；
6. runtime test 必须证明即使业务数据携带伪造 label/unit/color，最终 Plan 仍只采用 JSON 声明；
7. staged audit 必须通过；最终所有页面迁移后再启用 strict contract。

## 共同违规模式

尚未迁移页面普遍存在四类结构债：页面 UX 直接 import Feature / Design / View；UX template 决定产品模块顺序和 shape 分支；静态可见文案及颜色/样式 fallback 留在 UX；`src/v2` 与复制后的 `src/product` 同时存在，形成双 namespace。

这些问题必须通过迁移消失，而不是通过改名或搜索结果掩盖。

## 迁移顺序

按风险分四批：

1. `steps` → `history` → `heartrate`：先用 Steps 建立通用 Surface 闭环，再扩展 chart/summary primitives；
2. `workout_select`, `workout`, `workout_history`, `today`：业务状态和复杂交互；
3. `settings/*`, `notification_demo`：重复卡片/表单 primitive 可收敛；
4. `applist`, `watchface`, `clock`, `clock_guard`：多 surface、表盘组件和应用入口最后收口。

每批完成后必须同时满足：普通业务测试不回归、`v3:frontend-audit` 对已迁移路由为 OK、赛事 beta RPK 能安装、用户核心页面 smoke test 通过。全部路由 OK 后才启用 strict contract 作为 `npm run check` 的强制门。
