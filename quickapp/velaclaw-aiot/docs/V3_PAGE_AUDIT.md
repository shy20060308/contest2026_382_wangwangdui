# V3 Page Frontend Audit

审计事实源是 `src/manifest.json -> router.pages`；持续校验由 `scripts/audit-v3-frontends.js` 自动枚举，不维护手工白名单。

当前目标状态：**17 / 17 product route 全部使用 Surface JSON + generic Surface Host。** 应用直接以 `pages/clock` 为入口；已经验证无必要的 `clock_guard` 路由、Surface 和 Controller 必须保持删除。页面 UX 已收敛为 thin shell；旧 `src/v2`、页面专属 `product/design/apps` 和专属 watchface UX 必须保持删除。JSON 引用的产品静态视觉资产（例如 launcher/settings icon）属于合法的设计资产，不等同于第二套前端实现。

| Route | Surface | 等级 | 状态 |
|---|---|---|---|
| `pages/clock` | `clock.json` | L3 | Declarative |
| `pages/heartrate` | `heartrate.json` | L1 | Declarative |
| `pages/steps` | `steps.json` | L1 | Declarative |
| `pages/applist` | `applist.json` | L3 | Declarative |
| `pages/notification_demo` | `notification_demo.json` | L1 | Declarative |
| `pages/history` | `history.json` | L2 | Declarative |
| `pages/workout_select` | `workout_select.json` | L1 | Declarative |
| `pages/workout` | `workout.json` | L2 | Declarative |
| `pages/workout_history` | `workout_history.json` | L1 | Declarative |
| `pages/watchface` | `watchface.json` | L3 | Declarative |
| `pages/settings/settings` | `settings__settings.json` | L1 | Declarative |
| `pages/settings/bluetooth` | `settings__bluetooth.json` | L1 | Declarative |
| `pages/settings/vibration` | `settings__vibration.json` | L1 | Declarative |
| `pages/settings/brightness` | `settings__brightness.json` | L1 | Declarative |
| `pages/settings/diagnostics` | `settings__diagnostics.json` | L1 | Declarative |
| `pages/settings/motion` | `settings__motion.json` | L1 | Declarative |
| `pages/today` | `today.json` | L2 | Declarative |

## 三级设计约束

等级描述的是**跨形态差异本身**，不是页面复杂度。L1 保持同一产品表达和交互语义，只改变几何、密度与字体；例如亮度在所有形态都必须是真 Slider，设置主页在所有形态都使用同一个 swipe-paged list，只改变每页数量和尺寸。L2 保持共享数据、动作和信息架构，只允许局部表达随形态变化；例如 History 的趋势图、Workout 的指标排布、Today 的摘要/月历密度。L3 只有在交互表面确实不同的时候使用；例如 Circle Launcher 的 Honeycomb、Pill Launcher 的 paged-list、Rect Launcher 的 designed-grid，以及形态独立的 Clock/Watchface composition。

## 硬条件

一个 route 只有同时满足这些条件才算完成：Surface JSON 与 manifest route 一一对应；JSON 拥有模块顺序、copy、视觉 token、交互配置与 shape variants；page UX 只依赖 generic Host/Page runtime；renderer/engine 没有页面特判；旧 Layout/View/专属 UX 已删除；三级适配 contract 与 interaction parity contract 通过。**架构通过不能替代体验保真**：如果迁移让 Honeycomb、Swipe/Pager、Slider、表盘 composition 等既有能力退化，即使 strict frontend audit 通过，也不算完成。

## 维护规则

新增或调整页面时，先确定三级适配等级，再修改 Surface JSON。如果现有 primitive 不足，应扩展真正通用的 schema primitive/engine，而不是降低产品体验，也不能在页面、renderer 或 controller 中加入 route-specific 视觉分支。

验证：

```bash
npm run v3:adaptation
npm run v3:interaction-parity
npm run v3:frontend-contract
npm run check
```

赛事 beta RPK 的安装和真机/模拟器 smoke test 仍是最终运行时验证的一部分；源码 contract 不能替代设备验证。
