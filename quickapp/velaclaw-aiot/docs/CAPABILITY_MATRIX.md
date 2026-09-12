# V3 Capability / Environment Matrix

This matrix keeps declarations, repository behavior, simulator observations and hardware observations separate. A manifest feature or mocked contract is not device proof.

## Environment identity

| field | repository/declaration | required/final evidence |
|---|---|---|
| QuickApp version | 3.0.0 / versionCode 30 | freeze release value |
| package | `com.application.watch.demo` | final package/signing identity TBD |
| min API | `minAPILevel: 2` | confirm final toolchain compatibility |
| min platform | `1000` | record actual image/firmware |
| design width | 192 | confirm rendered target profiles |
| entry route | `pages/clock` | install/launch evidence TBD |
| manifest routes | 17 | smoke all release-critical routes |
| contest emulator image | required: `vela-miwear-watch-5.0(开发者大赛)` | exact installed image/version TBD |
| aiot-core / emulator | plan requires 1.7.22+ | exact versions TBD |

## Capability matrix

Status vocabulary:

- **declared** — manifest contains feature/permission.
- **repo-contract** — gateway/business behavior has deterministic repository tests.
- **sim-TBD** — required contest-image evidence is still missing.
- **device-TBD** — hardware/firmware evidence is still missing.
- **remote-TBD** — companion/peer evidence is still missing.

| capability | manifest / permission | repository behavior | simulator | hardware / remote | release rule |
|---|---|---|---|---|---|
| Router | `system.router` | owner-scoped retry-safe navigation contracts | sim-TBD | device-TBD | route smoke + touch required |
| Device metadata | `system.device` | provisional profile corrected by explicit native shape | sim-TBD | device-TBD | record model/shape/dimensions |
| Battery | `system.battery` | Clock semantic state path exists | sim-TBD | device-TBD | unavailable must remain explicit |
| Brightness | `system.brightness` | native success/fail drives applied/error; manual takeover from auto is explicit | sim-TBD | device-TBD | do not claim applied on invocation alone |
| Sensor / motion | `system.sensor` | generation-owned subscribe/fail/unsubscribe; UI throttling | sim-TBD | device-TBD | verify native cadence + release |
| Geolocation | `system.geolocation`, LOCATION permission | generation-owned stream + first-fix timeout protection | sim-TBD | device-TBD | post-first-fix freshness/drift still open |
| Vibrator | `system.vibrator` | haptics contracts and semantic actions | sim-TBD | device-TBD | verify actual vibration behavior |
| Event | `system.event` | product event paths only where consumed | sim-TBD | device-TBD | no assumption beyond observed events |
| Interconnect | `system.interconnect` | connection/lazy packet foundation | sim-TBD | remote-TBD | local send success is not peer ACK |
| Storage | `system.storage` | keyed queue, watchdog, structured read, quarantine recovery | sim-TBD | device-TBD | verify missing/corrupt/I/O behavior on image |
| Health | `service.health`, HEALTH permission | official sample provenance, timestamp ordering, recent-window dedupe | sim-TBD | device-TBD | source-specific freshness cadence still open |

## Health data truth

For each type record actual service behavior before setting stale thresholds.

| type | repository semantic state | measured timestamp source | observed update cadence | stale threshold | simulator evidence | hardware evidence |
|---|---|---|---|---|---|---|
| heart rate | official live/recent/unavailable | TBD | TBD | TBD | TBD | TBD |
| oxygen | official/unavailable | TBD | TBD | TBD | TBD | TBD |
| stress | official/unavailable | TBD | TBD | TBD | TBD | TBD |

A missing source timestamp must not be rewritten as a fake measurement timestamp. Received time and measured time are different fields/meanings.

## Form-factor matrix

| profile | repository fixture | authored coverage | required native evidence |
|---|---|---|---|
| Circle | 466×466, circle mask | Clock/Watchface L3; Honeycomb launcher | font/mask screenshot + touch/hit |
| Pill | 212×520, pill mask | Clock/Watchface L3; paged launcher | font/mask screenshot + swipe/touch |
| Rect | 390×450 contest-board geometry fixture | Clock/Watchface; grid launcher | board/emulator screenshot + touch/hit |

Repository geometry preview is intentionally conservative but still does not prove native font rasterization or event hit testing.

## Display/power terminology

| product term | repository meaning | device proof needed |
|---|---|---|
| ACTIVE | active Clock display policy | brightness/screen behavior |
| DIM | temporary dim policy | actual native brightness + owner restore |
| `SLEEP` | current ambient-like internal state with a reachable wake path | do not call hardware sleep or claim power savings without measurement |

## Sync/notification protocol scope

Current repository evidence supports local semantic notification/call demo behavior and lazy sync packet generation. It does **not** yet prove:

- Android companion package/signature compatibility;
- peer persisted ACK;
- record-version ACK marking;
- packet MTU/UTF-8 byte budget;
- lost/reordered/duplicated packet recovery;
- remote phone hangup/control ACK.

Release copy must either close these with companion evidence or explicitly keep the corresponding feature in demo/unsupported scope.

## Evidence update rule

When a simulator/device result is obtained, record:

1. exact source SHA;
2. RPK hash;
3. image/firmware/tool version;
4. action performed;
5. observed result;
6. log/screenshot/sample path;
7. whether it changes a release claim.

Do not overwrite `TBD` with an assumption based on another firmware, old branch or mock.