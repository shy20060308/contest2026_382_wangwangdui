---
name: vela-surface-design
description: Design or revise Vela wearable Surface JSON while preserving truthful data, page-local visual authority, accepted interactions, and explicit Circle/Pill/Rect adaptation.
---

# vela-surface-design

Use this skill for Vela page/watchface design, Surface JSON authoring, visual hierarchy, form-factor adaptation, readability, interaction placement and visual redesign.

Do not use it as the primary workflow for persistence, sensor semantics, protocol design, lifecycle ownership or runtime correctness. Those tasks belong to `vela-runtime-refactor`.

## Required inputs

Read the smallest relevant set before editing:

- `src/product/frontend/surface.schema.json`
- target `src/product/frontend/surfaces/*.json`
- `src/product/frontend/adaptation-policy.json`
- target controller state/action contract
- generic runtime / component / engine used by the Surface
- `references/wearable-design-principles.md`
- `references/review-checklist.md`
- relevant profile fixtures under `fixtures/`
- current repository checks for geometry and interaction parity

If a capability is unavailable in the task environment, keep the formal UI state unavailable/error. Never invent a plausible health, workout, sensor or connection value for the product state.

## Non-negotiable invariants

1. Surface JSON is the authored presentation source of truth for copy, layout, visual tokens, shape variants and declared actions.
2. Controllers output semantic state/actions; they do not own page colors, display strings, radii or shape-specific layout.
3. Generic UX/runtime code does not gain route-specific visual decisions.
4. Real, unavailable, stale and error states remain distinguishable.
5. Circle, Pill and Rect may use different compositions when the declared adaptation level requires it.
6. Runtime does not silently clamp or repair authored geometry to make an invalid design pass.
7. Accepted gestures and direct manipulation remain part of the design contract unless the requested redesign explicitly changes them.
8. Geometry preview, repository tests and device evidence are reported as different evidence classes.

## Workflow

### 1. Define the product task

Before choosing colors or moving boxes, state:

- primary user task;
- first-screen primary action;
- visual focal point;
- secondary information;
- unavailable/error state;
- gestures that must remain reachable.

### 2. Choose adaptation depth

Use the lowest correct level for every meaningful difference:

- **L1 shared-expression** — same expression and interaction; geometry/density varies.
- **L2 local-expression** — shared product/data/actions; selected module composition varies by shape.
- **L3 independent-surface** — a form factor needs a genuinely different composition/interaction while JSON remains authority.

Do not use L3 merely to avoid good shared variants. Do not flatten an accepted L3 interaction into a generic list.

### 3. Enumerate states

Account for applicable states before styling:

- loading / ready;
- unavailable / stale / error;
- empty / non-empty;
- selected / unselected;
- active / dim / ambient-like;
- overlay / normal;
- long text / large number / null value.

### 4. Edit authored JSON first

Prefer existing schema concepts and generic primitives. Product decisions stay in Surface JSON.

If the requested design cannot be represented:

1. prove the missing concept is reusable rather than route-specific;
2. define the schema/runtime contract;
3. add cost/geometry/interaction contracts;
4. extend the generic renderer or engine;
5. configure the product behavior from JSON.

Never add a page-specific UX renderer as the shortcut.

### 5. Review Circle / Pill / Rect separately

For each relevant profile inspect:

- visible mask, not only the rectangular bounds;
- glyph and long-text stress values;
- complete tap target, not only text center;
- top/bottom gesture areas;
- scroll/paging reachability;
- overlay priority;
- large numeric values and unavailable markers.

### 6. Preserve interaction semantics

Verify all relevant surfaces:

- tap text/icon/card whitespace;
- long press;
- horizontal/vertical swipe;
- drag/inertia/snap;
- Slider user-only change;
- back/route transition;
- overlay interception.

### 7. Run repository gates

Use the project `npm run check` path and `npm run build`. For visual work pay particular attention to:

```text
v3:design
v3:adaptation
v3:surfaces
v3:schema
v3:frontend-contract
v3:interaction-parity
design:visibility
watchface:preview
```

Do not weaken an ownership, schema or geometry contract to make a visual diff pass.

### 8. Record evidence accurately

Use the correct evidence class:

- authored JSON review;
- deterministic geometry preview;
- repository behavior/contract test;
- QuickApp build;
- simulator/device screenshot or hit test.

Target-device fields belong in `docs/DEVICE_ACCEPTANCE_CHECKLIST.md`; measured performance belongs in `docs/PERFORMANCE_BASELINE_TEMPLATE.md`.

## Output contract

For a completed design task report:

1. user task and adaptation decision;
2. authored Surface files changed;
3. preserved actions/gestures;
4. empty/unavailable/error behavior;
5. Circle/Pill/Rect evidence;
6. node/resource budget change when meaningful;
7. repository check/build result;
8. device measurement fields produced by the task.

## Anti-patterns

Reject or revise:

- hard-coded product copy in generic formatter/runtime;
- controller-generated colors or layout labels;
- page-specific UX renderer for one route;
- runtime geometry clamp that hides authored overflow;
- fixed fake watchface preview unrelated to selected design truth;
- shrinking tiny text further just to solve first-screen overflow;
- treating square bounding-box success as Circle-mask success;
- removing gestures because buttons are easier;
- claiming native visual acceptance from Node geometry output.

## Project patterns

Study these as patterns, not copy/paste templates:

- Clock call overlay: authored shape-specific geometry plus first-screen/mask contracts.
- Watchface selector: build-time preview IR derived from Clock Stage truth.
- Brightness: JSON-owned Slider with semantic desired/applied/error state.
- History: missing today remains missing instead of relabeling the latest available record as today.
- AppList: L3 Circle Honeycomb, Pill paged list and Rect grid from one product authority.

The Skill is self-contained under `skills/vela-surface-design/`; its design rules and review material do not live in `docs/`.