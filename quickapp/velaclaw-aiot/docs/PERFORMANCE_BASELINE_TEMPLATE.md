# V3 Performance Baseline Template

This document is a measurement template, not a performance claim. Fill it only with observations from a named simulator/device image and one source/RPK SHA pair.

## Identity

- Source SHA: `TBD`
- RPK SHA-256: `TBD`
- Emulator/device: `TBD`
- Image/firmware: `TBD`
- aiot-core: `TBD`
- aiot-emulator: `TBD`
- Date/time: `TBD`
- Tester: `TBD`

## Measurement rules

1. Use the same image/firmware for before/after comparisons.
2. Do not mix cold and warm launches in one statistic.
3. Record median/p50 and p95 where enough samples exist; keep max and anomalies.
4. JS `surface*Ms` and `routeSurfaceReadyMs` are model-side timings, not native layout/paint or touch latency.
5. System free memory, process memory, JS heap and graphics buffers are different quantities; label the source of every number.
6. Power comparison is valid only with matched brightness, sample rates, screen state, duration and workload.
7. When tooling is unavailable, write `not measured`; never substitute an estimate.

## Scenario matrix

| Scenario | Repetitions | Cold/warm | JS metrics | native/render evidence | memory/resource evidence | result |
|---|---:|---|---|---|---|---|
| Cold launch → usable Clock | 10 | cold | route/surface snapshot | timestamp/video/trace | process/system before+after | TBD |
| Clock default 60 s | 3 | warm | serialize/resolve/decorate/context/js | frame/touch if available | timers/subscriptions/memory | TBD |
| Mechanical 60 s | 3 | warm | same | frame/touch if available | visible resources/memory | TBD |
| Launcher honeycomb drag 30 s | 3 | warm | route + controller metrics | gesture/frame evidence | timer/resource recovery | TBD |
| Workout running 60 s | 3 | warm | update cadence | GPS/HR UI trace | timers/subscriptions/memory | TBD |
| Workout pause/resume | 10 cycles | warm | route/state samples | touch/state video | owner/resource recovery | TBD |
| Max workout/history records | 3 | warm | resolve/js | scroll responsiveness | memory peak/recovery | TBD |
| Sync failure → retry | 10 | warm | transfer timestamps | companion/mock evidence | transfer/resource cleanup | TBD |
| 30 page round trips | 30 | warm | route p50/p95 | optional video | memory/resource trend | TBD |

## Repository-side metrics snapshot

Capture Diagnostics values before the scenario and at the end. Do not call these FPS or native rendering values.

- `surfaceSerializeAvgMs`: `TBD`
- `surfaceSerializeMaxMs`: `TBD`
- `surfaceResolveAvgMs`: `TBD`
- `surfaceResolveMaxMs`: `TBD`
- `surfaceDecorateAvgMs`: `TBD`
- `surfaceDecorateMaxMs`: `TBD`
- `surfaceContextAvgMs`: `TBD`
- `surfaceContextMaxMs`: `TBD`
- `surfaceJsAvgMs`: `TBD`
- `surfaceJsMaxMs`: `TBD`
- `routeSurfaceReadyAvgMs`: `TBD`
- `routeSurfaceReadyP50Ms`: `TBD`
- `routeSurfaceReadyP95Ms`: `TBD`
- `routeSurfaceReadyMaxMs`: `TBD`

## Cold launch samples

| sample | process start | page init | model ready | usable interaction | total | note |
|---:|---:|---:|---:|---:|---:|---|
| 1 | | | | | | |
| 2 | | | | | | |
| 3 | | | | | | |
| 4 | | | | | | |
| 5 | | | | | | |
| 6 | | | | | | |
| 7 | | | | | | |
| 8 | | | | | | |
| 9 | | | | | | |
| 10 | | | | | | |

## Route samples

Record the route pair as well as latency. Do not aggregate unrelated route types without retaining the raw rows.

| from | to | sample | Surface-ready ms | native usable ms if measurable | note |
|---|---|---:|---:|---:|---|
| Clock | Launcher | 1 | | | |
| Launcher | Clock | 1 | | | |
| Clock | Watchface | 1 | | | |
| Watchface | Clock | 1 | | | |
| Workout Select | Workout | 1 | | | |
| Workout | History | 1 | | | |

## Memory / resource recovery

For each scenario capture the same counters at baseline, peak, immediately after exit and after a fixed recovery interval.

| scenario | point | system memory | process memory | JS heap if available | timers | subscriptions | page stack | notes |
|---|---|---:|---:|---:|---:|---:|---:|---|
| 30 route loops | baseline | | | | | | | |
| 30 route loops | peak | | | | | | | |
| 30 route loops | exit | | | | | | | |
| 30 route loops | recovery | | | | | | | |

Primary pass condition before setting numeric budgets: no unexplained monotonic growth and resources return to the known baseline owner set after the page exits.

## Touch / render evidence

If supported by the firmware/tools, record:

- tap-down → action timestamp
- action → route request
- target Surface ready
- native first visible frame / usable frame
- dropped/stalled frame evidence

If only screen recording is available, state its frame rate and measurement uncertainty.

## Power comparison

Only compare matched workloads.

| workload | brightness | display state | sensor rates | duration | energy/current source | result |
|---|---:|---|---|---:|---|---|
| Clock active | | | | | | |
| Clock ambient-like | | | | | | |
| Workout running | | | | | | |

The internal `SLEEP` label is not evidence of hardware sleep or lower power.

## Decision log

After data collection, record whether each proposed optimization is justified.

| proposal | evidence | decision | reason |
|---|---|---|---|
| F27 page-local controller composition | TBD | TBD | actual bundle/load cost required |
| F29 shape/face resource split | TBD | TBD | actual resource/load cost required |
| F28 dependency-level leaf update | TBD | TBD | rebuild cost vs complexity required |
| additional preview virtualization | TBD | TBD | current Circle 25/115 IR primitive gate already active |

Do not increase caching or lifecycle complexity merely because an optimization is theoretically possible.