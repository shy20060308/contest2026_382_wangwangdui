# V3 Capability / Environment Matrix

本文把 manifest 声明、仓库行为和目标环境实测记录分开。声明与 repository contract 描述代码当前具备的能力边界；模拟器、硬件与对端数据只填写实际观察结果。

## 环境

| Field | Repository / declaration | Acceptance record |
|---|---|---|
| QuickApp version | `3.0.0` / versionCode `30` |  |
| Package | `com.application.watch.demo` |  |
| min API | `minAPILevel: 2` |  |
| min platform | `1000` |  |
| design width | `192` |  |
| entry route | `pages/clock` |  |
| manifest routes | `17` |  |
| contest emulator image | `vela-miwear-watch-5.0(开发者大赛)` |  |
| aiot-core / emulator | `1.7.22+` |  |

## Capability matrix

| Capability | Manifest / permission | Repository behavior | Simulator evidence | Hardware / peer evidence |
|---|---|---|---|---|
| Router | `system.router` | owner-scoped, retry-safe navigation |  |  |
| Device metadata | `system.device` | provisional profile is corrected by explicit native shape |  |  |
| Battery | `system.battery` | semantic battery state with explicit unavailable handling |  |  |
| Brightness | `system.brightness` | native success/fail drives applied/error; manual takeover from auto is explicit |  |  |
| Sensor / motion | `system.sensor` | generation-owned subscribe/fail/unsubscribe and presentation throttling |  |  |
| Geolocation | `system.geolocation`, LOCATION | generation-owned stream and first-fix timeout protection |  |  |
| Vibrator | `system.vibrator` | semantic haptic patterns and runtime ownership |  |  |
| Event | `system.event` | consumed system events flow through the capability boundary |  |  |
| Interconnect | `system.interconnect` | connection, packetized transfer, progress, failure state and retry |  |  |
| Storage | `system.storage` | keyed queue, watchdog, structured read and quarantine recovery |  |  |
| Health | `service.health`, HEALTH | official sample provenance, timestamp ordering and recent-window dedupe |  |  |

## Health data record

实测时分别记录 measured timestamp、received time、更新 cadence 与最终采用的 stale threshold。缺少 source timestamp 时不伪造 measurement timestamp。

| Type | Repository semantic state | Timestamp source | Observed cadence | Stale threshold | Simulator evidence | Hardware evidence |
|---|---|---|---|---|---|---|
| Heart rate | live / recent / unavailable |  |  |  |  |  |
| Oxygen | live / recent / unavailable |  |  |  |  |  |
| Stress | live / recent / unavailable |  |  |  |  |  |

## Form factors

| Profile | Repository fixture | Authored coverage | Native evidence |
|---|---|---|---|
| Circle | 466×466, circle mask | Clock/Watchface L3; Honeycomb launcher |  |
| Pill | 212×520, pill mask | Clock/Watchface L3; paged launcher |  |
| Rect | 390×450 contest-board geometry fixture | Clock/Watchface; grid launcher |  |

Repository geometry preview用于确定性设计约束；原生字体、mask 与事件命中记录在设备证据列。

## Display / Power

| Product term | Repository meaning | Device evidence |
|---|---|---|
| ACTIVE | active Clock display policy |  |
| DIM | temporary dim policy with owner restore |  |
| `SLEEP` | ambient-like internal state with reachable wake path |  |

硬件睡眠或功耗收益只使用实际测量数据描述。

## Sync / notification

仓库中的 Sync 由 Interconnect capability、packet protocol、语义状态与 retry 路径组成；Notification / call demo 使用本地语义动作与 overlay ownership。Android/peer 侧结果、业务确认、包序与传输环境数据记录在下表。

| Item | Evidence |
|---|---|
| Companion package / signature |  |
| Peer business acknowledgement |  |
| Record-version acknowledgement |  |
| UTF-8 / transport payload budget |  |
| Loss / reorder / duplicate behavior |  |
| Remote control behavior |  |

## Evidence identity

每条 simulator / device / peer 结果至少绑定：source SHA、RPK SHA-256、image/firmware/tool version、操作步骤、观察结果和日志/截图/样本路径。跨版本数据不混写为同一验收结果。