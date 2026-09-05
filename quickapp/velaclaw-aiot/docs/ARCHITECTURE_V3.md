# V3 Design Runtime

V3 is a breaking design-runtime reset. Git history is the compatibility layer; runtime code does not keep V2 bridges.

## One path

`Device Profile → Host Scene + declared safe insets → App Recipe → Adapter translation → App resolver → UX`

- Device Profile owns physical shape, dimensions and explicit safe insets.
- Scene performs only the 192-design-width projection and applies those insets.
- Recipe owns visual intent: sizes, positions, typography, spacing and shape overrides.
- Adapter merges recipes and translates coordinates/box model. It does not scan, scale, clamp or invent geometry.
- App resolver performs only composition that cannot be represented as static recipe data.
- UX renders the resolved plan and feature state.

## Difference levels

- L1: same product and expression; geometry changes.
- L2: local expression changes while product/data remain shared.
- L3: product/interaction surface is genuinely different.

The level belongs to the difference, not to the whole page.

## Rules

1. No `src/presentation` design stack.
2. No `src/v2/design/specs` or `src/v2/design/views` compatibility bridges.
3. No component-width-driven safe-area calculation.
4. No circle chord fitting, Y scanning, aesthetic scaling or runtime geometry repair.
5. No duplicate size validation across width/height/scale for the same concern. Validate the recipe/plan contract once.
6. Full-bleed backgrounds are scene-level; safe insets constrain content only.
7. Feature orchestrates Domain/Capabilities. Design does not depend upward on Feature/Capability.
8. Health and workout only surface official live health samples; presentation must not fabricate distributions.

## Tests

`npm run check` keeps two design checks only:

- `v3:architecture`: one runtime path, no retired bridges/solver layers.
- `v3:design`: explicit insets, direct translation and all current app designs resolve on Circle/Pill/Rect.

Business behavior remains covered by capability, power, health, workout, activity, settings, motion, haptics, calendar, analog and honeycomb tests. Geometry is not re-proved in each feature test.
