# V3 Simulator / Device Acceptance Checklist

This checklist is the device-side gate for the V3 product branch. Repository contracts and QuickApp build success are necessary but do not count as simulator/device acceptance.

## Environment record

Record these values before testing so screenshots, logs and measurements can be tied to one environment.

- Source commit SHA: `TBD`
- RPK path and SHA-256: `TBD`
- Required emulator image: `vela-miwear-watch-5.0(开发者大赛)`
- aiot-core version: `TBD` (contest plan requires 1.7.22+)
- aiot-emulator version: `TBD` (contest plan requires 1.7.22+)
- Host OS / IDE version: `TBD`
- Device / firmware when hardware is used: `TBD`
- Test date: `TBD`

Do not substitute another image to make an install issue disappear. If installation or launch fails on the required contest image, record the failure as a release blocker.

## Gate A — install and launch

- [ ] Install the newly built V3 RPK, not the launcher/default application.
- [ ] Confirm package identity shown by the tool matches the built artifact.
- [ ] Launch into the custom Clock surface.
- [ ] Cold restart and confirm the same custom application launches again.
- [ ] Capture the install command/tool output and one Clock screenshot.

Expected evidence: RPK hash, install log, launch log, screenshot, source SHA.

## Gate B — three form factors and visual truth

For every available contest profile, capture Clock and Watchface selector evidence. Geometry-preview tests are not substitutes for these screenshots.

### Circle

- [ ] Simple / Sport / Dashboard / Mechanical render inside the visible circle.
- [ ] Mechanical tick marks and hands match the selector preview.
- [ ] Selected watchface indicator is visible and follows selection.
- [ ] Long numbers (`99,999`, `100%`) are not clipped.
- [ ] Call overlay primary actions are visible without scrolling.

### Pill

- [ ] Simple / Sport / Dashboard / Alpine render inside the visible mask.
- [ ] Large time and five-digit step values are readable.
- [ ] Watchface preview identity matches Clock.
- [ ] Swipe / page controls remain reachable.

### Rect / contest board profile

- [ ] 390×450-equivalent layout is usable.
- [ ] Incoming-call actions remain first-screen reachable.
- [ ] Header, bottom actions and gesture area do not overlap.

## Gate C — touch and gesture propagation

These cases specifically cover behavior that Node tests cannot prove.

- [ ] Clock: tap metric text, icon and empty card area.
- [ ] Clock: swipe up to launcher.
- [ ] Clock: left/right watchface switch.
- [ ] Clock: long press opens watchface selector.
- [ ] Notification/call overlay blocks Clock-only gestures.
- [ ] Collection: short drag, long drag and inertia do not produce an accidental tap.
- [ ] Slider drag changes value only from user input and does not navigate.
- [ ] Fast back / repeated tap does not create duplicate route transitions.

Record any event-propagation difference between Circle, Pill and Rect.

## Gate D — persistence and recovery

- [ ] Activity survives normal restart.
- [ ] Settings survive normal restart.
- [ ] Watchface selection survives normal restart.
- [ ] Workout finalized record survives restart without duplication.
- [ ] Diagnostics storage page shows Activity / History / Workout / Settings / Watchface status.
- [ ] If a controlled corrupt-storage fixture is available, corrupt content is reported and not overwritten automatically.
- [ ] Two-step recovery creates a quarantine backup before reset.
- [ ] An I/O failure is reported without destructive recovery.

Never corrupt production/user data just to satisfy this checklist; use an isolated test profile or prepared fixture.

## Gate E — Health / Motion / Location / Workout

- [ ] Missing health data displays unavailable state rather than fabricated values.
- [ ] First live heart-rate sample appears once in the recent window.
- [ ] Leaving and returning does not allow an old callback to overwrite a new subscription.
- [ ] Motion sampling stops after the final consumer exits.
- [ ] Workout GPS starts as locating; valid location updates distance from GPS only.
- [ ] Pause/resume does not let an old GPS timeout mark the resumed session unavailable.
- [ ] Finish → retry after an injected persistence failure creates one stable record only.
- [ ] Leaving the app / hiding the workout follows the documented foreground-session policy once Step 10 is finalized.

Health/GPS freshness thresholds remain a device-observed item until actual service timestamp cadence is recorded.

## Gate F — display and power behavior

- [ ] Brightness UI distinguishes requested/applied/error when native callback fails.
- [ ] Manual slider takeover from auto brightness behaves as documented.
- [ ] Clock ACTIVE / DIM / ambient-like state transitions are reachable.
- [ ] Opening Settings after a dim Clock does not leave an unintended brightness owner active.
- [ ] The product never claims hardware sleep or power savings solely from the internal `SLEEP` name.

Record actual screen behavior and firmware limitations. Do not infer power savings without measurement.

## Gate G — performance baseline

Run the fixed scenarios from `PERFORMANCE_BASELINE_TEMPLATE.md` on the same image/firmware. At minimum record:

- [ ] cold launch to usable Clock
- [ ] route-to-Surface-ready p50/p95
- [ ] Clock default and Mechanical interaction
- [ ] honeycomb continuous drag
- [ ] Workout running / paused
- [ ] maximum history view
- [ ] sync failure / retry
- [ ] 30 page round trips and resource/memory recovery

JS-side metrics are supplementary; native render/touch, system memory and power require simulator/device tooling.

## Gate H — release smoke path

Run without developer intervention between steps:

1. cold launch
2. switch watchface
3. open launcher
4. open health with available/unavailable path
5. start workout
6. pause / resume
7. finish workout
8. open history
9. open settings and diagnostics
10. return to Clock
11. show notification / call demo and dismiss it

- [ ] No crash, stuck initialization or unexpected route jump.
- [ ] No fabricated health/workout data.
- [ ] No visible storage-recovery blocker in a clean profile.
- [ ] Resource counts return toward baseline after leaving high-frequency pages.

## Evidence naming

Use one directory outside generated/build outputs for captured evidence. Recommended names:

- `YYYYMMDD_<sha>_env.txt`
- `YYYYMMDD_<sha>_install.txt`
- `YYYYMMDD_<sha>_clock_circle.png`
- `YYYYMMDD_<sha>_clock_pill.png`
- `YYYYMMDD_<sha>_clock_rect.png`
- `YYYYMMDD_<sha>_performance.csv`
- `YYYYMMDD_<sha>_smoke.txt`

Only mark an item passed when the evidence points to the same source SHA and built RPK.