# Wearable Design Engine

The Design Engine is not a universal layout converter. Its purpose is to decide **how much automation a wearable page should accept before implementation begins**, then provide the smallest set of primitives needed at that freedom level.

> Automation removes repetition. Art direction owns meaningful differences.

## 1. Skill interview comes first

A development Skill should not immediately generate one UI and then force it onto circle, rectangle and pill screens. Before page implementation it asks the user to choose, or confirm, a Design Freedom Level.

### L1 — Auto

Use when the page is structurally ordinary and shape differences have little product value.

Typical pages:

- settings lists
- detail pages
- simple forms and controls
- ordinary paged lists

The Design Engine may automatically decide safe geometry, scale, spacing, vertical alignment and page capacity.

Current references:

- `pages/detail` — centered `auto-stack`
- `pages/settings/settings` — `paged-stack`

`paged-stack` first finds the largest safe page capacity, then expands density when a tall viewport has spare room. A pill screen therefore does not inherit tiny circle typography merely because both use the same 192 design width.

L1 pages should not contain shape-specific top-level geometry or `profile.isCircle ? ...` capacity rules.

### L2 — Assisted

Use when semantics are shared but composition has meaningful design value.

Typical pages:

- workout dashboards
- health/history dashboards
- media controls
- information-dense status pages

The application shares Domain state, actions and semantic components. The Design Engine validates geometry and provides viewport primitives, while the layout spec may choose different compositions for each form factor.

Current references:

- `pages/workout` — pill auto composition, art-directed circle/rect compositions
- `pages/history` — composed dashboard header plus independent scrolling record flow

`scroll-flow` deliberately distinguishes two different concepts:

1. viewport composition that must satisfy safe geometry;
2. normal scrolling content that is allowed to move through clipped screen edges.

A scrolling list must not be treated as if every record had to fit inside the static safe region simultaneously.

### L3 — Free

Use when the visual/interaction model itself is part of the product design.

Typical pages:

- watchfaces
- honeycomb launchers
- games
- strongly branded or experimental interfaces

The Engine supplies viewport, safe bounds, shared semantics and optional external visual engines. It does **not** attempt to auto-recompose one surface into another.

Launcher design is defined as:

- Circle → Honeycomb
- Pill → Paged List
- Rect → Designed 2-column Grid

All three consume one shared `domain/apps/catalog`.

The circle Honeycomb is a presentation engine in `presentation/engines/honeycomb.js`; its lattice math is not business logic and is not an Adapter responsibility.

## 2. Design Engine architecture

```text
Requirement / Product Intent
          ↓
Design Freedom Interview
          ↓
Semantic Model + Shared Domain
          ↓
┌─────────────────────────────────────────┐
│ L1 Auto       L2 Assisted      L3 Free │
│ auto-stack    composition      surface  │
│ paged-stack   scroll-flow      engine   │
└─────────────────────────────────────────┘
          ↓
Viewport + Safe Geometry
          ↓
Circle / Rect / Pill
```

Adapter primitives are implementation tools **inside** the Design Engine. They are not the product architecture by themselves.

## 3. Layout Plan metadata

Every Design Engine plan carries its development decision:

```js
{
  freedomLevel: 1 | 2 | 3,
  strategy: 'auto' | 'assisted' | 'free',
  shape,
  composition,
  safeBounds,
  regions,
  needsOverride,
  reason
}
```

Specialized primitives may add semantic metadata:

- `paged-stack`: `pageSize`, `capacityReduced`, `verticalScale`, `visualScale`
- `scroll-flow`: `heroHeight`, `stream`, `tokens`
- `free-surface`: `surface`, `appIds`, `pageSize`, `columns`

The Engine must refuse an unsafe automatic result instead of silently shrinking below readable limits.

## 4. Capability Runtime is a separate axis

Design freedom applies to presentation. Device abilities should remain highly unified.

```text
Vela APIs
   ↓
Capability Runtime
   ↓
Domain
   ↓
Design Engine / Presentation
```

Examples:

- `heart_rate`
- `blood_oxygen`
- `stress`
- `motion`
- `location`
- `battery`
- `device`
- `display_power`
- `storage`
- `vibration`

Capability Gateways are small, independently triggerable and lazy. They do not know screen shape or product presentation policy.

This produces the intended split:

> Upper layers preserve design freedom; lower layers unify device capabilities.

## 5. Skill decision rule

Before generating a page, a Skill should:

1. identify shared functional semantics;
2. estimate visual importance, interaction specificity, shape sensitivity and information density;
3. recommend L1, L2 or L3;
4. ask the user to confirm the Design Freedom Level;
5. generate only the primitives appropriate for that level;
6. validate all target form factors;
7. if an L1 layout cannot remain readable, stop and ask whether the user wants an L2/L3 redesign instead of hiding the failure with more scaling.

This question is part of product design, not merely a technical implementation option.
