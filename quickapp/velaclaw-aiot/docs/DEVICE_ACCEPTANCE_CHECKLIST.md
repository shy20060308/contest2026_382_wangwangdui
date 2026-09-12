# V3 Simulator / Device Acceptance

本文定义 V3 在指定赛事镜像和目标设备上的验收路径。仓库 contract 与 QuickApp build 用于验证代码和架构；安装、原生触摸、传感器、渲染、内存与功耗数据记录在本文件对应证据位。

## 环境记录

| 项目 | 记录 |
|---|---|
| Source commit SHA |  |
| RPK path |  |
| RPK SHA-256 |  |
| Emulator image | `vela-miwear-watch-5.0(开发者大赛)` |
| aiot-core version |  |
| aiot-emulator version |  |
| Host OS / IDE version |  |
| Device / firmware |  |
| Test date |  |

同一轮验收的截图、日志和性能数据必须对应同一个 source SHA 与 RPK。

## 安装与启动

验收路径：安装本次构建的 V3 RPK → 核对 package identity → 启动进入自定义 Clock → 冷启动再次进入同一应用。

| 证据 | 记录 |
|---|---|
| Install log |  |
| Launch log |  |
| Clock screenshot |  |
| Cold restart result |  |

## 三形态视觉

### Circle

Simple / Sport / Dashboard / Mechanical 均位于可见圆形内；Mechanical 刻度与指针和 selector preview 一致；选中态清晰；`99,999`、`100%` 等长值不裁切；来电主动作首屏可达。

### Pill

Simple / Sport / Dashboard / Alpine 位于可见胶囊区域内；大时间与五位步数可读；selector preview 与 Clock 一致；分页与 swipe 操作可达。

### Rect

390×450-equivalent 布局可用；来电动作首屏可达；header、底部动作和手势区域不重叠。

| Form factor | Screenshot / result |
|---|---|
| Circle |  |
| Pill |  |
| Rect |  |

## 触摸与手势

设备验收覆盖：Clock 指标文字/图标/卡片空白点击；上滑启动器；左右切表盘；长按表盘；通知/来电 overlay 拦截 Clock-only gesture；Collection 短拖/长拖/惯性不误触；Slider 仅由用户输入提交；快速 back / repeated tap 不产生重复路由。

| 项目 | 结果 / 证据 |
|---|---|
| Clock gestures |  |
| Overlay interception |  |
| Collection drag / inertia |  |
| Slider input |  |
| Navigation dedupe |  |

## 持久化与恢复

Activity、Settings、Watchface 选择和 Workout 完成记录在正常重启后保持一致；Diagnostics 展示 Activity / History / Workout / Settings / Watchface 持久化状态。受控损坏数据进入 corrupt 状态，不被默认值自动覆盖；显式恢复先创建 quarantine，再 reset；I/O failure 不触发破坏性恢复。

| 项目 | 结果 / 证据 |
|---|---|
| Normal restart |  |
| Corrupt fixture |  |
| Quarantine / reset |  |
| I/O failure |  |

## Health / Motion / Location / Workout

缺失健康数据保持 unavailable；第一条实时心率只进入 recent window 一次；旧订阅 callback 不覆盖新 owner；最后消费者退出后停止 Motion；Workout GPS 从 locating 进入有效定位；pause/resume 后旧 timeout 不影响新 session；完成记录在重试路径保持单一稳定记录。

| 项目 | 结果 / 证据 |
|---|---|
| Health cadence / freshness |  |
| Motion ownership |  |
| GPS freshness / drift |  |
| Workout finish / retry |  |

## 显示与 Power

Brightness 区分 requested / applied / error；手动 Slider 可接管 auto brightness；Clock ACTIVE / DIM / ambient-like 状态可达；从 dim Clock 进入 Settings 时显示 owner 正确移交。功耗结论只记录测量结果，不由内部状态名推导。

| 项目 | 结果 / 证据 |
|---|---|
| Brightness apply |  |
| Auto/manual ownership |  |
| Display state transition |  |
| Power measurement |  |

## 性能场景

固定场景使用 [PERFORMANCE_BASELINE_TEMPLATE.md](PERFORMANCE_BASELINE_TEMPLATE.md) 记录：冷启动到可操作 Clock、route-to-Surface-ready p50/p95、Clock default/Mechanical、Honeycomb 连续拖动、Workout running/paused、最大 History、Sync retry、30 次页面往返与资源回稳。

## Release smoke

固定路径：cold launch → switch watchface → launcher → health available/unavailable → start workout → pause/resume → finish → history → settings/diagnostics → Clock → notification/call demo → dismiss。

| 项目 | 结果 / 证据 |
|---|---|
| Smoke log |  |
| Crash / stuck state |  |
| Data truth |  |
| Resource recovery |  |

## 证据命名

推荐使用：

```text
YYYYMMDD_<sha>_env.txt
YYYYMMDD_<sha>_install.txt
YYYYMMDD_<sha>_clock_circle.png
YYYYMMDD_<sha>_clock_pill.png
YYYYMMDD_<sha>_clock_rect.png
YYYYMMDD_<sha>_performance.csv
YYYYMMDD_<sha>_smoke.txt
```

只有与同一 source SHA 和 RPK 对应的设备数据进入最终验收记录。