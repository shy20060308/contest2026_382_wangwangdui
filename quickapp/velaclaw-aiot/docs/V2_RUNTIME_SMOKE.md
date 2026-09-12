# V2.4 contest-runtime smoke checklist

This checklist is the runtime gate that complements `npm run check` and `npm run build`. Passing static contracts or a successful build does **not** prove the contest simulator/runtime is healthy.

Run the checklist on the contest-provided mirror before merging changes that affect pages, navigation, lifecycle, gestures, timers, device profiles, or native capability gateways.

## Required form factors

Test at least one target for each form factor available in the contest mirror:

- Circle
- Pill / band
- Rect / watch

Record the exact simulator/device profile used with the result.

## Core navigation path

For each form factor, start from a fresh app launch and complete all steps without restarting the app:

1. Clock renders and continues updating.
2. Swipe left and right to switch watch faces; verify the UI remains responsive.
3. Swipe up from Clock to open AppList.
4. Interact with AppList:
   - Circle: drag the honeycomb, allow inertia to settle, then open an app.
   - Pill/Rect: change page when multiple pages exist, then open an app.
5. In the opened app, perform one primary interaction and verify it responds.
6. Navigate back to AppList, then back to Clock.
7. Long-press Clock to open the watch-face selector.
8. Select a different face and return to Clock.
9. Repeat Clock → AppList → app → back once more to catch lifecycle/timer leaks.

## Stability checks

A run fails if any of the following occurs:

- Blank or frozen page.
- Scrolling/dragging still animates but taps or navigation no longer respond.
- Back navigation stops working or routes to an unexpected page.
- Duplicate overlays, timers, sensor updates, or repeated page initialization are visible.
- Watch-face switching works but other navigation freezes.
- App requires a restart to recover.

## Evidence

For every PR touching runtime-sensitive code, record:

- Commit SHA tested.
- Contest mirror/image identifier.
- Form factor and resolution.
- PASS/FAIL for Circle, Pill, and Rect.
- First failing step plus relevant runtime log excerpt when a failure occurs.

Do not mark a runtime regression fixed from CI/build results alone. Runtime PASS means this checklist was completed on the contest-provided environment.
