# Vela Wearable Design Skill

This project uses a wearable-specific design discipline adapted from open frontend-design practices. The goal is not to generate HTML/CSS. The goal is to preserve a deliberate product experience while Surface JSON remains the only authored presentation authority.

## Design source of truth

1. The accepted V2.4 UI/interaction behavior is the parity baseline unless a deliberate redesign is documented.
2. `src/product/frontend/surfaces/*.json` owns copy, visual tokens, layout mode, shape variants and interaction declarations.
3. Generic UX components may implement reusable primitives and engines, but they must not contain route IDs, app IDs, page copy, page colors or page-specific geometry.
4. Controllers own semantic state and actions only. They must not decide presentation copy, color, radius or screen-shape layout.
5. A migration is incomplete if functionality or interaction quality is reduced merely to fit the current renderer.

## Wearable design principles

- Preserve product identity before polishing. Redesign means improve the accepted experience, not replace it with a generic card list.
- Circle, pill and rect are different compositions, not merely different widths.
- Circle may use radial/honeycomb/analog structures when they fit the task. Do not flatten them into lists for implementation convenience.
- Pill favors vertical rhythm and reachable controls, but information cards must not become oversized capsules by default.
- Rect may use grids and denser grouping where that improves scanning.
- Gesture behavior is part of the design contract. Swipe, drag, inertia, snapping, long-press and sliders cannot be silently replaced by buttons.
- Keep hierarchy intentional: one primary focus, restrained secondary text, semantic accent colors, consistent spacing rhythm, and clear state feedback.
- Avoid decorative complexity that costs clarity or power. Motion must communicate state, continuity or direct manipulation.

## Required parity checks

For every route, audit these dimensions against the accepted baseline:

- information and actions are all present;
- primary visual hierarchy remains recognizable;
- scroll direction and pagination behavior are preserved;
- gestures and direct-manipulation controls are preserved;
- Circle/Pill/Rect keep their intended distinct layout modes;
- touch targets remain usable;
- no visual or interaction decision is duplicated outside Surface JSON.

## High-value parity contracts

- Clock: direct entry; left/right swipe changes face; up swipe opens apps; long press opens face selector; power/notification overlays remain functional.
- AppList: Circle uses draggable inertial honeycomb with center emphasis and snap; Pill uses paged list; Rect uses designed grid; swipe paging remains available on Pill/Rect.
- Brightness: real 0-255 slider is the primary manual brightness control; auto brightness, raise-to-wake and low-power controls remain available.
- Watchface: selection is visual and shape-aware, not reduced to a plain text list.
- Data pages: scrolling remains natural; charts and metric grouping are not replaced by generic navigation buttons.

## Implementation rule

When a parity feature needs code, add a generic primitive/engine first and make its behavior configurable from Surface JSON. Never restore a page-specific UX implementation just to regain the old appearance.

## Design review sequence

1. Read the accepted baseline implementation/screenshots.
2. State the preserved interaction model.
3. Choose the shape-specific composition.
4. Encode the design in Surface JSON.
5. Extend only generic primitives/engines where necessary.
6. Run contract tests and build.
7. Verify on `vela-miwear-watch-5.0-beta` before declaring parity.

This discipline is informed by open frontend-design skill patterns that emphasize intentional hierarchy, responsive adaptation, interaction/motion and critique of existing UI, but the rules above are specific to the Vela wearable runtime and this product.
