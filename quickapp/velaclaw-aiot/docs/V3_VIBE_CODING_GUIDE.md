# V3 Vibe Coding Guide

V3 is designed so a human or AI can make a local product change without first reverse-engineering a page-specific frontend. The rule is simple: edit the lowest layer that actually owns the decision.

## Where to change things

| Goal | Change here |
| --- | --- |
| Text, color, spacing, radius, typography, module order | `src/product/frontend/surfaces/*.json` |
| Circle / Pill / Rect geometry or density | Surface `variants` |
| Same product, but one local expression differs by shape (L2) | Shape-specific module overrides in the same Surface |
| A genuinely different interaction/composition by shape (L3) | Surface `experience` selecting a generic primitive/engine |
| Reusable interaction math or physics | Generic `frontend/engines` / generic component |
| Business state, persistence, sensor/device behavior | Feature / Domain / Capability |
| Turning a semantic action into a business operation | `controller_registry.js` semantic adapter |

## Do not do these

- Do not add page-specific markup to a thin route `.ux` file.
- Do not put product copy, colors, route IDs or page geometry inside a generic renderer/engine.
- Do not replace a slider, swipe, pager, honeycomb or other accepted interaction with buttons because the current renderer is easier that way.
- Do not make Circle / Pill / Rect visually identical just because they share one JSON source.
- Do not promote a difference to L3 when L1 geometry or an L2 local expression is sufficient.
- Do not put business truth such as battery, sensor availability or connection state into JSON defaults. `initialState` is only for explicit UI loading/page state.

## Three-level decision shortcut

1. **L1 shared-expression** — same interaction and information expression; change geometry/density only.
2. **L2 local-expression** — same product/data/actions; one or more local modules use a different expression by shape.
3. **L3 independent-surface** — the form factor genuinely needs a different composition or interaction engine.

Always choose the lowest sufficient level.

## Typical vibe-coding requests

- “Make the Pill health cards less rounded.” → change Pill tokens in `heartrate.json`.
- “Circle History is too crowded; make only its trend compact.” → L2 module override in `history.json`.
- “Change Circle AppList honeycomb spacing and center emphasis.” → edit Honeycomb parameters in `applist.json`; do not edit the Honeycomb engine unless the algorithm itself must change.
- “Add a new reusable segmented selector.” → implement one generic primitive/mode, then configure its product content/actions in JSON.
- “The sensor status is wrong.” → inspect Capability/Feature/Controller, not the visual Surface.

## Before considering a change complete

Run `npm run check` and `npm run build`, then verify the affected interaction on `vela-miwear-watch-5.0-beta`. A green contract proves architecture and declared behavior, not visual quality; simulator review remains required for visual parity.
