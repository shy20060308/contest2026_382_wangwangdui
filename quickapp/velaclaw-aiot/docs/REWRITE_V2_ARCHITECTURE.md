# Vela Design Engine V2 Rewrite

This branch is a full implementation rewrite. Existing pages are functional and visual references only.

## Non-negotiable invariants

- Preserve product capabilities, user data, navigation meaning and low-power behavior.
- Do not preserve legacy page structure, magic geometry, compatibility wrappers or shape branching.
- Raw Vela device APIs live behind capability gateways.
- Domain owns business meaning and persistence policy.
- Pages own lifecycle, events and binding only.
- Design differences are first-class and may be large.

## Runtime pipeline

```text
Vela native APIs
  -> Capability Runtime
  -> Domain / State Machines
  -> Application Feature Models
  -> Design Freedom Strategy
  -> Composition / Scene
  -> Vela Page
```

## Host Scene contract

V2 never rewrites the viewport supplied by the host. Device space and host page space are different coordinate systems.

```text
Device Space
  full logical display

Host Scene
  the viewport Vela actually grants to the page

Design Safe Space
  device safe geometry projected into Host Scene coordinates
```

For a beta Band 10 example, a full logical height can be 471 while the host grants a scene beginning at y=24 with height 447. A 168-wide pill safe top near device y=52 becomes scene y=28. The Design Engine must project safe geometry into the host scene instead of adding the host inset a second time or expanding the root beyond the host viewport.

## Design Freedom interview

Before generating a new page, the future Skill asks the user to choose or approve a level:

- L1 Auto: standard lists, settings, simple details, simple scroll flows. Engine owns most geometry.
- L2 Assisted: dashboards, health, workout, Today. Shared semantics with shape-specific composition.
- L3 Free: watchfaces, honeycomb launcher, games and strongly art-directed surfaces. Engine supplies scene/safe primitives only.

The engine may recommend a level, but the user owns the design decision.

## V2 page rule

Every rewritten page binds through `v2/app/page_runtime` and renders strictly inside its Host Scene. No page may make its root taller than the host scene to compensate for device geometry.

## Rewrite order

1. Kernel: Scene, navigation, design freedom, system facade.
2. Clock / launcher / Today shell.
3. Health and activity surfaces.
4. Workout and history.
5. Watchface selector and watchface runtime.
6. Settings and diagnostics.
7. Remove old common/platform compatibility paths after all routes are V2.
