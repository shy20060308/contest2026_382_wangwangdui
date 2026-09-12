# V3 Repair / Validation Evidence Index

This index separates repository evidence from simulator/device evidence. A green Node/QuickApp build entry never means the required contest image has installed or visually passed the same SHA.

## Evidence levels

- **Behavior** — executable domain/runtime test reproduces the old failure or protects the repaired rule.
- **Contract** — schema/static/architecture test protects ownership or configuration boundaries.
- **Build** — QuickApp/JSC build succeeded for the same source head.
- **Geometry preview** — deterministic shape/layout computation; not a screenshot or native hit-test.
- **Simulator/device** — actual required image or hardware evidence.
- **Companion/remote** — Android/peer protocol and business ACK evidence.

## Current branch / pre-simulator baseline

- Base: `refactor/v3-native-product`
- Audit branch: `audit/v3-native-performance-20260911`
- PR: `#13` (Draft; do not merge only because CI is green)
- Required contest emulator image: `vela-miwear-watch-5.0(开发者大赛)`
- Latest code/docs/Skill baseline validated before this index-only update: `64d9462475194026954706391610ce012b93d7cd`
- GitHub Actions: **V3 QuickApp Check run #356** (`34667326358`) — full contracts success + QuickApp build success.

The next acceptance boundary is the required-image install/launch smoke. Run #356 is repository/build evidence only.

## High-risk repair index

| item | result | repository evidence | device/remote evidence still needed |
|---|---|---|---|
| F01 truthful Workout metrics | elapsed time no longer fabricates steps/calories/distance; unavailable stays null | `workout:truth`, `workout:experience` | real sensor/GPS behavior |
| F02 Workout completion | stable `finishedAt`; first completion persists finalized intent before record; retries reuse identical record; an already-finalized retry never rewrites active intent and exposes `待保存 / 重试保存` instead of a fake resumable pause | `workout:truth`, `workout:experience`, crash-window/restart fixtures; run #356 | storage callback ambiguity sanity on contest image |
| F03 corrupt persistence | structured missing/corrupt/I/O; five persistence domains visible in Diagnostics; explicit quarantine-before-reset | `storage:recovery-core`, Activity/Settings/History/Workout tests | actual storage failure behavior and recovery UI |
| F04 Activity midnight | canonical store rolls business date before read/write and queued saves retain their own date | `activity:rollover` | system RTC behavior on target |
| F05 History calendar window | real records only within today-6..today; missing today remains missing, no fake zero/today highlight | `history:calendar`, `history:truth` | visual/history scroll on device |
| F06/F07 async ownership | stale health/motion callbacks cannot mutate a new owner | `async:ownership` | native callback ordering sanity |
| F08 freshness | timestamp ordering groundwork exists; final source-specific stale thresholds not closed | partial contracts | **required** health cadence/device data |
| F09 Health recent window | initial live sample inserted once; recent naming replaces fake daily semantics | `health:logic`, `health:official` | live health display |
| F10 Location ownership | old callback/fail and old GPS timeout cannot affect new owner | `async:ownership` | continuous-location freshness/drift/long-gap |
| F12 page generation | destroyed/hidden owner blocks late writes | `async:ownership`, page runtime contracts | navigation/device sanity |
| F13–F17 routing/interaction | owner-scoped navigation, retry-safe dedupe, collection watchers, overlay route policy | `interaction:ownership`, `v3:interaction-parity` | **F16 requires native touch/gesture propagation** |
| F18 Device Profile | explicit native shape corrects provisional ratio inference | `device:profile` | target profile metadata |
| F20 display apply truth | native callback determines applied/error | `display:runtime` | firmware setter callback behavior |
| F22 slider | only user events commit; auto mode drag becomes explicit manual takeover | `interaction:ownership`, settings contracts | native slider event semantics |
| F26 call demo truth | UI says local demo instead of remote hangup promise | `clock:notification` | no remote hangup claim unless companion protocol exists |
| F35 schema truth | unsupported module/placement rejected at compile/check | `v3:schema`, strict frontend audit | generated resource availability on device |
| F37/F38 duplicate authority | dead routes/catalog/state removed | truth/package/performance contracts | none beyond smoke regression |
| F39 documentation truth | root/QuickApp/English README now describe 17 routes, current Surface architecture, form-factor launcher behavior, minAPI 2 and the exact contest image | `docs:check`, run #356 | final clean-environment/release README verification |
| F40/F41/F43 geometry/readability | authored Circle/Rect call layout and mask/text stress checks | `design:visibility`, `clock:notification` | screenshots + hit tests |
| F42 Watchface preview | previews generated from Clock Stage IR; selected state dynamic; Circle far previews gated | `watchface:preview` | three-shape visual match |
| F47 copy ownership | weekday/loading display text owned by Surface JSON | `copy:ownership`, truth contracts | none beyond visual regression |

## Parallel work products now present

- `docs/DEVICE_ACCEPTANCE_CHECKLIST.md` — required-image install/launch, three-shape, touch, persistence, sensor, display and smoke gates.
- `docs/PERFORMANCE_BASELINE_TEMPLATE.md` — same-environment cold launch, route p50/p95, native render/touch, memory/resource recovery and power template.
- `docs/CAPABILITY_MATRIX.md` — separates manifest declaration, repository contract, simulator, hardware and remote evidence.
- `skills/vela-surface-design/SKILL.md` + profile fixture/review checklist.
- `skills/vela-runtime-refactor/SKILL.md` + failure-window checklist.

The Skill files are useful project workflows but **are not yet contest-validity evidence by file existence alone**. They still require real task execution in a supported environment and recorded output/evidence.

## Performance evidence already available

Repository-side only:

- Surface signature skip avoids a full presentation rebuild for identical visible state/profile input.
- Hidden pages defer visual rebuild and catch up once visible.
- `surfaceSerialize / surfaceResolve / surfaceDecorate / surfaceContext / surfaceJs` avg/max metrics exist.
- `routeSurfaceReady` keeps recent successful push/replace samples with avg/p50/p95/max.
- Circle Watchface initial generated preview primitive gate is 25/115 for current authored data.
- Sync packet generation is lazy instead of materializing payload → pieces → packets simultaneously.

These observations are not native FPS, RAM, power, first-paint latency or touch latency. Fill `PERFORMANCE_BASELINE_TEMPLATE.md` after simulator/device access is available.

## Known green CI milestones

These historical runs prove repository state at their associated heads; later heads require their own run.

| run | purpose at the time | result |
|---:|---|---|
| #190 | Step 05 interaction ownership | contracts + build success |
| #200 | F18/F26/F41 | contracts + build success |
| #209 | F40/F43 visibility | contracts + build success |
| #224 | F42 preview truth | contracts + build success |
| #245 | Step 07 metrics + F35 | contracts + build success |
| #277 | storage/sync/state payload cleanup | contracts + build success |
| #291 | F47 + Health/Location ownership | contracts + build success |
| #307 | F04/F05 calendar semantics | contracts + build success |
| #310 | storage operation watchdog | contracts + build success |
| #325 | Clock-critical corrupt-storage recovery + Diagnostics | contracts + build success |
| #334 | History/Workout recovery and five-domain Diagnostics | contracts + build success |
| #338 | stable finalized Workout record retry | contracts + build success |
| **#356** | **pre-simulator baseline: F02 no-rewrite retry + explicit finalizing UI + docs/Skill/acceptance assets** | **contracts + QuickApp build success** |

## Open items that cannot be closed by current CI alone

- **next gate:** required contest-image install → launch → verify custom RPK
- F08 source-specific Health freshness thresholds
- F10 post-first-fix GPS stale/long-gap/drift behavior
- F16 touch/gesture hit propagation and cancellation
- F19/F21 display owner / ambient-like behavior on firmware
- Step 07 native render/touch, memory recovery and power baseline
- F27/F29 bundle/loading decisions, which require measured benefit and product stability before added complexity
- Step 09 dependency-level leaf updates, which need before/after measurements
- F11 foreground/background Workout policy and device lifecycle evidence
- F23–F25/F34 true sync ACK, peer persistence, UTF-8/MTU and Android companion validation
- F45 final package/signing identity
- F46 final RPK, video, supported AI Coding logs and official submission evidence

## Final release evidence slots

Fill these only for the frozen release SHA.

- Final source SHA: `TBD`
- `npm ci`: `TBD`
- `npm run check`: `TBD`
- `npm run release`: `TBD`
- RPK path: `TBD`
- RPK SHA-256: `TBD`
- Required-image install evidence: `TBD`
- Cold-launch evidence: `TBD`
- Three-shape screenshots: `TBD`
- Performance baseline: `TBD`
- Core smoke log: `TBD`
- Android companion / sync ACK evidence: `TBD` or explicitly unsupported in final scope
- Skill paths and validation examples: `TBD`
- Demo video: `TBD`
- Final README verified from clean environment: `TBD`
- Official-team-repository PR/check status: `TBD`

If an item is intentionally unsupported for the contest release, record that explicitly in product copy and README rather than leaving an implied promise.