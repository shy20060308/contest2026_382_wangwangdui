# Vela Wearable Design Skill

This project uses a wearable-specific design discipline adapted from open frontend-design practices. The goal is not to generate HTML/CSS. The goal is to preserve a deliberate product experience while Surface JSON remains the only authored presentation authority.

## Design source of truth

1. The accepted V2.4 UI/interaction behavior is the parity baseline unless a deliberate redesign is documented.
2. `src/product/frontend/surfaces/*.json` owns copy, visual tokens, layout mode, shape variants and interaction declarations.
3. `src/product/frontend/adaptation-policy.json` owns the three-level cross-form-factor adaptation classification.
4. Generic UX components may implement reusable primitives and engines, but they must not contain route IDs, app IDs, page copy, page colors or page-specific geometry.
5. Controllers own semantic state and actions only. They must not decide presentation copy, color, radius or screen-shape layout.
6. A migration is incomplete if functionality or interaction quality is reduced merely to fit the current renderer.

## Three-level adaptation discipline

The level describes the depth of a **difference**, not page complexity. A route records the highest level it needs, while individual differences should stay at the lowest correct level.

### L1 — shared-expression

Same product and same expression; only geometry/density changes.

Use one shared JSON module tree and shared interaction semantics. Circle/Pill/Rect may override dimensions, spacing, radius and typography. Do not introduce a separate engine merely because a control is interactive: a brightness slider shared by every shape is still L1.

### L2 — local-expression

Product, data and actions remain shared, but selected local expressions change by form factor.

Keep one shared JSON product model. Allow module-level variant changes for local layout/composition while preserving the rest of the tree. Do not fork the whole page or create a page-specific renderer.

### L3 — independent-surface

At least one form factor requires a genuinely different product/interaction surface.

JSON remains the product authority, but shape-specific JSON may select a different generic Experience/Engine/Composition. Examples: Circle honeycomb vs Pill paged list, or a shape-aware watchface surface. The engine owns reusable math/interaction physics only; product content, visual values, actions and engine selection stay in JSON.

### Anti-patterns

- Do not downgrade an L3 experience to a generic list/button layout just to keep the renderer simple.
- Do not upgrade L1/L2 to L3 merely to avoid designing proper shared variants.
- Do not classify by code size or business complexity. A complex data page can still be L1 if its expression is shared.
- Do not place fallback visual values inside an engine. If JSON omits a required L3 parameter, fail the contract instead of inventing a design.

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
- the selected L1/L2/L3 adaptation level matches the actual depth of the difference;
- no visual or interaction decision is duplicated outside Surface JSON.

## High-value parity contracts

- Clock: L3; direct entry; left/right swipe changes face; up swipe opens apps; long press opens face selector; power/notification overlays remain functional.
- AppList: L3; Circle uses draggable inertial honeycomb with center emphasis and snap; Pill uses paged list; Rect uses designed grid; swipe paging remains available on Pill/Rect.
- Brightness: L1; real 0-255 slider is the same primary manual control on all shapes; auto brightness, raise-to-wake and low-power controls remain available.
- Watchface: L3; selection is visual and shape-aware, not reduced to a plain text list.
- History / Workout / Today: L2; data and semantics stay shared while only the necessary local expression changes.
- Heart / Steps / Settings / Notification / Workout Select / Workout History: L1; preserve one shared expression and adapt geometry only.

## Implementation rule

When a parity feature needs code, first determine its difference level. For L1/L2, extend JSON variants or generic primitives before writing new code. For L3, add or reuse a generic experience engine and make every product-specific decision configurable from Surface JSON. Never restore a page-specific UX implementation just to regain the old appearance.

## Design review sequence

1. Read the accepted V2.4 implementation/screenshots.
2. Identify each meaningful cross-form-factor difference and assign L1/L2/L3.
3. State the preserved interaction model.
4. Choose the shape-specific composition at the lowest correct level.
5. Encode product decisions in Surface JSON.
6. Extend only generic primitives/engines where the selected level requires it.
7. Run architecture, adaptation, interaction-parity and build contracts.
8. Verify on `vela-miwear-watch-5.0-beta` before declaring parity.

This discipline is informed by open frontend-design skill patterns that emphasize intentional hierarchy, responsive adaptation, interaction/motion and critique of existing UI, but the rules above are specific to the Vela wearable runtime and this product.
