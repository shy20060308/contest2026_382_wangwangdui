# V3 Page Frontend Audit

审计事实源是 `src/manifest.json -> router.pages`；持续校验由 `scripts/audit-v3-frontends.js` 自动枚举，不维护手工白名单。

当前目标状态：**18 / 18 route 全部使用 Surface JSON + generic Surface Host。** 页面 UX 已收敛为 thin shell；旧 `src/v2`、页面专属 `product/design/apps`、专属 watchface UX 和不再使用的 raster visual assets 必须保持删除。

| Route | Surface | 状态 |
|---|---|---|
| `pages/clock` | `clock.json` | Declarative |
| `pages/clock_guard` | `clock_guard.json` | Declarative |
| `pages/heartrate` | `heartrate.json` | Declarative |
| `pages/steps` | `steps.json` | Declarative |
| `pages/applist` | `applist.json` | Declarative |
| `pages/notification_demo` | `notification_demo.json` | Declarative |
| `pages/history` | `history.json` | Declarative |
| `pages/workout_select` | `workout_select.json` | Declarative |
| `pages/workout` | `workout.json` | Declarative |
| `pages/workout_history` | `workout_history.json` | Declarative |
| `pages/watchface` | `watchface.json` | Declarative |
| `pages/settings/settings` | `settings__settings.json` | Declarative |
| `pages/settings/bluetooth` | `settings__bluetooth.json` | Declarative |
| `pages/settings/vibration` | `settings__vibration.json` | Declarative |
| `pages/settings/brightness` | `settings__brightness.json` | Declarative |
| `pages/settings/diagnostics` | `settings__diagnostics.json` | Declarative |
| `pages/settings/motion` | `settings__motion.json` | Declarative |
| `pages/today` | `today.json` | Declarative |

## 硬条件

一个 route 只有同时满足这些条件才算完成：Surface JSON 与 manifest route 一一对应；JSON 拥有模块顺序、copy、视觉 token 与 shape variants；page UX 只依赖 generic Host/Page runtime；renderer 没有页面特判；旧 Layout/View/专属 UX 已删除；strict audit 通过。

## 维护规则

新增页面时，不要复制旧 UX。先创建 Surface JSON，再接语义 Controller；如果现有 primitive 不够，应增加真正通用的 schema primitive，而不是在页面、renderer 或 controller 中加入 route-specific 视觉分支。

验证：

```bash
npm run v3:frontend-contract
npm run check
```

赛事 beta RPK 的安装和真机/模拟器 smoke test 仍是最终运行时验证的一部分；源码 contract 不能替代设备验证。
