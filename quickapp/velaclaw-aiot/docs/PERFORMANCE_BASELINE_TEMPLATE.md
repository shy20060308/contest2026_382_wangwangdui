# V3 Performance Baseline

本文记录同一 source SHA、RPK 与设备环境下的性能数据。没有目标设备数据时字段保持空白，不用估算值替代测量。

## 环境

| 项目 | 记录 |
|---|---|
| Source SHA |  |
| RPK SHA-256 |  |
| Emulator / device |  |
| Image / firmware |  |
| aiot-core |  |
| aiot-emulator |  |
| Host OS / IDE |  |
| Date / time |  |
| Tester |  |

## 测量规则

1. 前后对比使用相同 image / firmware、亮度、数据规模和操作路径。
2. Cold launch 与 warm launch 分开统计。
3. 样本量足够时记录 p50、p95、max，并保留异常样本。
4. JS `surface*Ms` 与 `routeSurfaceReady*Ms` 不是 native layout / paint / touch latency。
5. System memory、process memory、JS heap、graphics buffer 分开记录来源。
6. 功耗对比保持亮度、display state、sensor rate、时长和 workload 一致。
7. 无法测量的指标保持空白。

## 场景矩阵

| Scenario | Repetitions | Cold / warm | JS metrics | Native / render evidence | Memory / resource evidence | Result |
|---|---:|---|---|---|---|---|
| Cold launch → usable Clock | 10 | cold |  |  |  |  |
| Clock default 60 s | 3 | warm |  |  |  |  |
| Mechanical 60 s | 3 | warm |  |  |  |  |
| Launcher Honeycomb drag 30 s | 3 | warm |  |  |  |  |
| Workout running 60 s | 3 | warm |  |  |  |  |
| Workout pause / resume | 10 cycles | warm |  |  |  |  |
| Maximum history / workout records | 3 | warm |  |  |  |  |
| Sync failure → retry | 10 | warm |  |  |  |  |
| 30 page round trips | 30 | warm |  |  |  |  |

## Runtime 指标

| Metric | Value |
|---|---:|
| `surfaceSerializeAvgMs` |  |
| `surfaceSerializeMaxMs` |  |
| `surfaceResolveAvgMs` |  |
| `surfaceResolveMaxMs` |  |
| `surfaceDecorateAvgMs` |  |
| `surfaceDecorateMaxMs` |  |
| `surfaceContextAvgMs` |  |
| `surfaceContextMaxMs` |  |
| `surfaceJsAvgMs` |  |
| `surfaceJsMaxMs` |  |
| `routeSurfaceReadyAvgMs` |  |
| `routeSurfaceReadyP50Ms` |  |
| `routeSurfaceReadyP95Ms` |  |
| `routeSurfaceReadyMaxMs` |  |

## Cold launch samples

| Sample | Process start | Page init | Model ready | Usable interaction | Total | Note |
|---:|---:|---:|---:|---:|---:|---|
| 1 |  |  |  |  |  |  |
| 2 |  |  |  |  |  |  |
| 3 |  |  |  |  |  |  |
| 4 |  |  |  |  |  |  |
| 5 |  |  |  |  |  |  |
| 6 |  |  |  |  |  |  |
| 7 |  |  |  |  |  |  |
| 8 |  |  |  |  |  |  |
| 9 |  |  |  |  |  |  |
| 10 |  |  |  |  |  |  |

## Route samples

| From | To | Sample | Surface-ready ms | Native usable ms | Note |
|---|---|---:|---:|---:|---|
| Clock | Launcher | 1 |  |  |  |
| Launcher | Clock | 1 |  |  |  |
| Clock | Watchface | 1 |  |  |  |
| Watchface | Clock | 1 |  |  |  |
| Workout Select | Workout | 1 |  |  |  |
| Workout | History | 1 |  |  |  |

## Memory / resource recovery

同一场景在 baseline、peak、exit、固定 recovery interval 四个点读取同类计数。

| Scenario | Point | System memory | Process memory | JS heap | Timers | Subscriptions | Page stack | Notes |
|---|---|---:|---:|---:|---:|---:|---:|---|
| 30 route loops | baseline |  |  |  |  |  |  |  |
| 30 route loops | peak |  |  |  |  |  |  |  |
| 30 route loops | exit |  |  |  |  |  |  |  |
| 30 route loops | recovery |  |  |  |  |  |  |  |

## Touch / render

记录同一交互链上的时间点：tap-down → action → route request → target Surface ready → native first visible / usable frame。使用屏幕录制测量时同时记录录制帧率和误差范围。

| Scenario | Input timestamp | Action | Surface ready | Native usable | Evidence |
|---|---:|---:|---:|---:|---|
| Clock → Launcher |  |  |  |  |  |
| Watchface switch |  |  |  |  |  |
| Slider commit |  |  |  |  |  |
| Workout pause / resume |  |  |  |  |  |

## Power

| Workload | Brightness | Display state | Sensor rates | Duration | Energy / current source | Result |
|---|---:|---|---|---:|---|---|
| Clock active |  |  |  |  |  |  |
| Clock ambient-like |  |  |  |  |  |  |
| Workout running |  |  |  |  |  |  |

内部 `SLEEP` 名称不作为硬件睡眠或功耗收益证据；结论只来自同场景测量。