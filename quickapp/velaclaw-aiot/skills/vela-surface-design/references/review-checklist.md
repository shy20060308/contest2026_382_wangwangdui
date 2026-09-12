# Surface Design Review Checklist

Use this after editing authored Surface JSON and before calling the task complete.

## Authority

- [ ] Copy/visual/layout changes are in `src/product/frontend/surfaces/*.json`.
- [ ] Controller/runtime changes, if any, are generic or semantic rather than route-specific styling.
- [ ] No second handwritten preview/layout truth was added.
- [ ] New action IDs are backed by a semantic controller action.

## Truthful states

- [ ] Loading is distinct from unavailable/error when the capability can fail.
- [ ] Missing measured data renders `--`/unavailable instead of fabricated zero or demo data.
- [ ] Stale/error copy does not imply current live measurement.
- [ ] Demo actions are named as demo/local behavior when no remote protocol exists.

## Adaptation

- [ ] The difference is classified L1/L2/L3 at the lowest correct level.
- [ ] Circle/Pill/Rect preserve accepted direct manipulation and navigation semantics.
- [ ] L3 experiences are not flattened into generic lists for convenience.
- [ ] L1/L2 pages were not unnecessarily forked into independent surfaces.

## Geometry / readability

Use `fixtures/profiles.json` plus project geometry tests.

- [ ] Long Chinese copy tested.
- [ ] `99,999`, `100%`, high heart-rate fixture and null values tested where relevant.
- [ ] Circle/Pill checks use visible masks, not only rectangular scene bounds.
- [ ] Full tap frames fit, not only centered glyph boxes.
- [ ] Primary actions are first-screen reachable when the task requires immediate action.
- [ ] Typography is not reduced below readable size merely to solve overflow.

## Interaction

- [ ] Tap on text/icon/card whitespace behaves consistently.
- [ ] Swipe direction and paging preserved.
- [ ] Long press preserved where accepted.
- [ ] Drag/inertia/snap preserves cancellation and does not cause accidental tap.
- [ ] Slider commits only user-originated changes.
- [ ] Overlay states block actions that belong only to the obscured page.

## Repository validation

- [ ] `npm run check` executed on the edited head.
- [ ] schema/compile gates pass.
- [ ] adaptation and geometry gates pass.
- [ ] interaction parity/ownership gates pass when actions changed.
- [ ] Watchface preview truth passes when Clock/Watchface changed.
- [ ] QuickApp build succeeds on the same head.

## Device evidence

Do not mark these from Node output:

- [ ] required contest image installed the RPK;
- [ ] native font/mask screenshot matches intent;
- [ ] tap/gesture propagation works;
- [ ] scrolling and slider native behavior works;
- [ ] performance/power statements are measured rather than inferred.

If device access is not available, report the task as repository/geometry validated with explicit device follow-up.