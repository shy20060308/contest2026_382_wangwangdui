# Wearable Design Principles

This reference belongs to `vela-surface-design`. It defines the project-specific design discipline used when authoring or revising Vela wearable Surface JSON.

## Design source of truth

1. `src/product/frontend/surfaces/*.json` owns copy, visual tokens, module structure, layout mode, shape variants and declared interactions.
2. Surface JSON is a Design IR for humans, AI and future visual tooling, not serialized page markup.
3. `src/product/frontend/adaptation-policy.json` owns the cross-form-factor adaptation classification.
4. Generic components and engines implement reusable primitives and interaction algorithms only; they do not own route IDs, product copy, product colors or page-specific geometry.
5. Controllers own semantic state and actions, not presentation decisions.
6. Declarative does not mean visually identical: Circle, Pill and Rect may use visibly different compositions whenever the selected adaptation level requires it.
7. Accepted gestures and direct manipulation are part of the design contract.
8. Health, workout and sensor presentation never invents business facts to make a screen look complete.

## Adaptation levels

### L1 — shared-expression

The product expression and interaction remain the same. Form factors may vary dimensions, spacing, radius, typography, density, card proportions and local geometry.

Use one shared module tree and shared actions. A shared brightness Slider is still L1 even though it is interactive.

### L2 — local-expression

Product semantics, data and actions remain shared while one or more local modules use a different expression by form factor.

Keep one product model. Use module-level variants for differences such as trend orientation, metric grouping or calendar density. Do not fork the whole page.

### L3 — independent-surface

A form factor needs a genuinely different composition or interaction surface while JSON remains product authority.

Shape-specific JSON may select a different generic experience/engine. Examples include Circle Honeycomb versus Pill paged list, and shape-aware Clock / Watchface composition. The engine owns reusable math and interaction physics; product content, visual values, actions and engine selection stay in JSON.

Always choose the lowest adaptation level that preserves the intended experience.

## Design IR discipline

Prefer product intent over low-level renderer instructions. Good authored concepts include semantic modules, reusable composition modes, content hierarchy, bindings, actions, visual tokens, interaction parameters and form-factor variants.

Low-level coordinates are appropriate where the interaction genuinely requires them, especially some L3 surfaces, but ordinary pages should not become serialized DOM. A field that exists only because of one renderer implementation detail usually belongs in a generic primitive rather than product JSON.

The schema should remain strong enough to prevent renderer special cases and small enough to avoid becoming a second programming language.

## Wearable composition

- Circle may use radial, honeycomb and analog structures when they fit the task.
- Pill favors vertical rhythm, readable primary information and reachable controls without turning every card into an oversized capsule.
- Rect can use grids and denser grouping where scanning benefits.
- One screen should have a clear primary focus with restrained secondary text and semantic accents.
- Touch target size is independent from glyph size.
- Long Chinese copy, English labels, five-digit steps, `100%`, unavailable markers and empty states are explicit stress cases.
- Motion communicates state, continuity or direct manipulation; decorative complexity is avoided.

## Interaction contract

Visual changes preserve the relevant interaction semantics:

- tap on text, icon and card whitespace;
- long press;
- horizontal / vertical swipe;
- drag, inertia and snap;
- Slider user-only commit;
- back and route transitions;
- overlay interception.

Notification or call overlays must not accidentally expose Clock-only gestures underneath them.

## High-value project contracts

- **Clock — L3:** direct entry, left/right face switch, swipe up to launcher, long press to selector, display and notification overlays.
- **AppList — L3:** Circle draggable inertial Honeycomb with center emphasis and snap; Pill paged list; Rect grid.
- **Brightness — L1:** a real 0–255 Slider remains the primary manual control on all form factors.
- **Watchface — L3:** visual, shape-aware selection using previews derived from Clock design truth.
- **History / Workout / Today — L2:** shared data/actions with only the necessary local form-factor expression changed.
- **Heart / Steps / Settings / Notification / Workout Select / Workout History — L1:** one shared product expression with geometry adaptation.

## Review sequence

1. Identify the user task, first-screen primary action and visual focal point.
2. Enumerate ready, loading, unavailable, stale, error, empty, selected, overlay and long-content states that apply.
3. Classify each meaningful cross-form-factor difference as L1, L2 or L3.
4. Preserve the accepted interaction model.
5. Edit authored Surface JSON first.
6. Extend a generic primitive/engine only when the missing concept is reusable.
7. Run schema, architecture, adaptation, geometry, interaction-parity and build gates.
8. Record Circle/Pill/Rect evidence at the correct evidence level.

## Anti-patterns

- flattening Honeycomb, pager, Slider or watchface composition into generic buttons for implementation convenience;
- route-specific copy, colors or geometry in a generic renderer/engine;
- controller-generated visual tokens;
- runtime geometry clamping that hides invalid authored design;
- fake health/workout values used as formal product state;
- absolute-coordinate JSON for ordinary content without a real interaction need;
- describing deterministic geometry preview as simulator/device visual acceptance.

The project runtime remains an implementation detail behind the authored Design IR; visual tooling should edit the same Surface JSON rather than create a second presentation authority.