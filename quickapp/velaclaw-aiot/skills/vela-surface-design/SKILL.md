---
name: vela-surface-design
description: Design or revise Vela wearable Surface JSON while preserving truthful data, page-local visual authority, accepted interactions, and explicit Circle/Pill/Rect adaptation.
---

# vela-surface-design

Use this skill when the task is primarily presentation design: a new Vela page/watchface, visual hierarchy, Surface JSON, form-factor adaptation, readability, interaction placement, or a visual redesign that must preserve business facts.

Do not use this skill as the primary workflow for persistence, sensor semantics, protocol design, lifecycle ownership, or unrelated runtime refactors. Those belong to `vela-runtime-refactor`.

## Required inputs

Before editing, read the smallest relevant set of project truth sources:

- `src/product/frontend/surface.schema.json`
- target file under `src/product/frontend/surfaces/`
- `src/product/frontend/adaptation-policy.json`
- target controller action/state contract
- generic renderer/runtime used by that Surface
- `docs/VELA_WEARABLE_DESIGN_SKILL.md`
- `docs/V3_FRONTEND_AUTHORITY.md`
- current device/profile fixtures and geometry contracts

If the task depends on a capability that is not verified on the target image, mark that dependency as unverified. Do not design fake success data merely to make the screen look complete.

## Non-negotiable invariants

1. Surface JSON is the authored presentation source of truth for copy, layout, visual tokens, shape variants, and declared actions.
2. Controllers output semantic state/actions; they do not own page colors, display strings, radii, or shape-specific layout.
3. Generic UX/runtime code must not gain route-specific visual decisions.
4. Real/unavailable/stale/error states remain distinguishable. Never replace unavailable measured data with a plausible-looking number.
5. Circle, Pill, and Rect may use different compositions when the declared adaptation level requires it.
6. Runtime must not silently clamp/fix authored geometry to make a broken design pass.
7. Existing accepted gestures and direct manipulation are part of the design contract unless the redesign explicitly changes them.
8. Static geometry/preview evidence must never be described as simulator/device visual acceptance.

## Workflow

### 1. State the user task and visual priority

Write down, briefly:

- primary user task;
- first-screen primary action;
- visual focal point;
- secondary information;
- unavailable/error state;
- gestures that must remain reachable.

Do this before choosing colors or moving boxes.

### 2. Classify adaptation depth

Choose the lowest correct level for each meaningful difference:

- **L1 shared expression** — same composition and interaction; geometry/density varies.
- **L2 local expression** — shared product model; selected module composition differs by shape.
- **L3 independent surface** — form factor needs a genuinely different interaction/composition while JSON remains authority.

Do not use L3 merely to avoid writing a good shared variant. Do not flatten an accepted L3 interaction into a generic list for implementation convenience.

### 3. Enumerate semantic states

For every edited element, account for applicable states before styling:

- loading / ready;
- unavailable / stale / error;
- empty / non-empty;
- selected / unselected;
- active / dim / ambient-like;
- overlay / normal;
- long text / large number / null value.

Use real or clearly marked demo fixtures. Do not use fabricated health/workout measurements as formal-state fixtures.

### 4. Edit authored JSON first

Prefer existing schema concepts and generic primitives. Keep product decisions in the Surface JSON.

When the requested design cannot be represented:

1. prove the missing concept is reusable, not route-specific;
2. define the schema/runtime contract for the generic primitive;
3. add cost/geometry tests;
4. only then extend the renderer.

Never create a page-specific UX renderer as the shortcut.

### 5. Check Circle/Pill/Rect separately

For each relevant profile, inspect:

- visible mask, not only rectangular bounds;
- glyph/text stress values;
- complete tap target, not only text center;
- top/bottom gesture areas;
- scroll/paging reachability;
- overlay priority;
- long Chinese copy and large numeric values.

For Clock/Watchface, preserve allowed face/shape combinations. Do not infer missing combinations as bugs without product evidence.

### 6. Preserve interaction semantics

Confirm actions by interaction surface:

- tap text/icon/card whitespace;
- long press;
- horizontal/vertical swipe;
- drag/inertia/snap;
- slider user-only change;
- back/route transition;
- overlay interception.

Changing the visual layout must not accidentally expose a forbidden Clock gesture through a notification/call overlay.

### 7. Run repository gates

At minimum execute the relevant checks through the project `npm run check` path so the same compiler/schema contracts used by CI are exercised.

Pay special attention to:

- `v3:design`
- `v3:adaptation`
- `v3:surfaces`
- `v3:schema`
- strict frontend authority
- interaction parity/ownership
- `design:visibility`
- `watchface:preview` when applicable
- QuickApp build

Do not weaken a geometry or ownership contract merely to make a visual diff pass.

### 8. Declare evidence level accurately

Use one of these labels in the result:

- authored JSON review;
- deterministic geometry preview;
- repository behavior/contract test;
- QuickApp build;
- simulator/device screenshot/hit test.

Only the last category proves native rendering/touch behavior.

For contest device acceptance use the required image `vela-miwear-watch-5.0(开发者大赛)` and the project checklist in `docs/DEVICE_ACCEPTANCE_CHECKLIST.md`.

## Output format

For a completed design task, report:

1. user task and adaptation decision;
2. authored Surface files changed;
3. preserved actions/gestures;
4. empty/unavailable/error handling;
5. Circle/Pill/Rect design evidence;
6. node/resource budget change when meaningful;
7. repository checks/build result;
8. exact items still requiring simulator/device validation.

## Anti-patterns

Reject or revise these approaches:

- hard-coded Chinese copy in generic formatter/runtime;
- controller-generated colors or layout labels;
- page-specific UX renderer for a single route;
- runtime geometry clamp to hide authored overflow;
- fixed fake `08:32` preview unrelated to the selected watchface;
- making tiny text smaller to solve first-screen overflow;
- treating square bounding-box success as Circle-mask success;
- removing gestures because buttons are easier to implement;
- claiming simulator parity from Node plan output.

## Real project examples to study

Use these as patterns, not copy/paste templates:

- Clock call overlay: authored shape-specific geometry plus first-screen/mask contracts.
- Watchface selector: build-time preview IR derived from Clock Stage truth, with far Circle previews VDOM-gated.
- Brightness: visual slider remains JSON-owned while controller state distinguishes desired/applied/error.
- History: missing today remains missing; presentation must not convert the last available record into “today”.

## Skill validation status

This `SKILL.md` defines the executable workflow but is not yet sufficient evidence that the contest Skill requirement is fulfilled. Before final release, validate it on one fresh design task using only this skill plus repository truth sources, record the resulting JSON diff/check/build/device evidence, and add that run to `docs/EVIDENCE_INDEX.md`.