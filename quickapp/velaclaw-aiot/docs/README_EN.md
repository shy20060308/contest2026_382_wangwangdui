# vela_band

**English** | [简体中文](../README.md)

`vela_band` is a Xiaomi Vela Quick App reference project for smart bands and watches. The current project version is **3.0.0** and uses a Recipe-first V3 design runtime to support Pill, Circle, and Rect wearable form factors in one RPK.

> This project is for contest demos, architecture validation, and wearable UI exploration. It is not medical software or production firmware. Official health surfaces only promote official live health samples; unavailable capabilities remain unavailable instead of being replaced with fabricated values.

## V3 architecture

There is one product path:

```text
Vela Native APIs
      ↓
Capabilities
      ↓
Domain / State Machines
      ↓
Feature Controllers
      ↓
Device Profile + Host Scene
      ↓
App Recipe
      ↓
V3 Adapter translation
      ↓
App Resolver
      ↓
Resolved Plan
      ↓
Optional Recipe-bound Product Math Engine
      ↓
UX / Watchface renderer
```

Responsibilities are strict:

- Capabilities wrap native Vela APIs and are the native-value normalization boundary.
- Domain owns business state, state machines, and persistence semantics, not screen geometry.
- Feature Controllers orchestrate lifecycle and behavior; they do not own layout or re-normalize canonical Domain/Capability values.
- `src/runtime/device_profile.js` validates physical device facts. Scene only projects them into design coordinates.
- Recipe owns visual intent, geometry, typography, spacing, form-factor differences, and visual constraints.
- Adapter translates Recipe data only; it does not scan, scale, clamp, fit, or invent geometry.
- Resolvers only compose Recipe relationships that cannot be represented statically; they do not repair a Recipe.
- A Product Math Engine is used only for genuine continuous geometry or interaction math. It consumes the resolved Recipe/Plan and may own inertia, damping, overscroll, or similar interaction physics, but it does not own a second set of static focus/icon/label design facts.
- UX renders after the resolved plan is ready and does not retain private non-zero geometry fallbacks.
- One fact has one owner and one normalization boundary. Downstream layers consume canonical data instead of repeatedly validating or silently repairing it.
- `src/common` is a static-resource namespace only.

See [V3 Design Runtime](ARCHITECTURE_V3.md) and [Project Owner Guide](PROJECT_OWNER_GUIDE.md).

## Current product surfaces

| Area | Current implementation |
| --- | --- |
| Watchfaces | Sport / Simple / Dashboard plus Circle Mechanical and Pill Alpine; layout comes from the Clock Recipe |
| Launcher | Circle honeycomb, Pill paged list, Rect designed grid; the Honeycomb Engine is configured by the resolved Launcher Recipe |
| Health | Heart rate, SpO2, stress, window trends, and explicit official-source provenance |
| Activity & History | Today activity and seven-day V3-persisted trends |
| Workout | Walk/run, pause/resume, official heart rate, location capability, workout history |
| Today | Date, lunar calendar, activity summary, and month calendar |
| Notifications | Local/system-event demos, call state, and haptic feedback |
| Sync | Business payload, packets, ACK progress, and an explicitly labeled mock transport |
| Settings | Brightness, vibration, sync, motion diagnostics, capability diagnostics |
| Power | ACTIVE / DIM / SLEEP runtime with display, heart-rate, and battery orchestration |

## Source layout

```text
src/
├── capabilities/          # native Vela gateways and native-value normalization
├── domain/                # business state, state machines, persistence
├── runtime/               # formal Page/Navigation/Device/Haptics/Power runtime
├── v2/
│   ├── features/          # current Feature Controllers (historical path name)
│   └── design/            # current V3 Scene / Recipe / Adapter / Resolver / View / Engine
├── pages/                 # product pages; plan binding + feature state + interaction
├── components/watchfaces/ # watchface renderers driven by Clock Recipe data
└── common/                # static images, icons, and watchface assets only
```

`src/v2` is a historical path name for current code; it does not mean V3 retains V2 runtime compatibility. `src/v2/app`, `src/v2/system`, the old Design Specs/Views, Geometry solver, and Presentation runtime have been retired.

The current product-first phase does not maintain Layout Studio/template tooling. If developer tooling is reintroduced later, it should consume the mature V3 Recipe/IR and one validator rather than duplicating Profiles, Recipe fields, mock data, or Adapter rules.

## Development

Requirements:

- Node.js 18+
- npm
- AIoT-IDE or compatible Vela Quick App tooling
- a compatible Vela emulator/device

Install locked dependencies and run the full gate:

```bash
npm ci
npm run check
```

Build the debug RPK:

```bash
npm run build
```

Development watch mode:

```bash
npm run start
```

V3-specific checks:

```bash
npm run v3:architecture
npm run v3:design
npm run v3:truth
```

`v3:architecture` rejects retired runtime/compatibility layers, runtime code under `src/common`, unresolved dependencies, product routes that bypass strict Recipe ownership, and hidden layout ownership regressions. `v3:design` resolves current app designs against Circle, Pill, and Rect profiles. `v3:truth` prevents fabricated telemetry, silent catalog fallbacks, and hidden default ownership from returning.

## V3 design and data rules

1. Do not restore `src/presentation`, `src/v2/app`, or `src/v2/system`.
2. Do not restore `src/v2/design/specs`, `src/v2/design/views`, or `geometry.js`.
3. Safe area is not recalculated from component width.
4. Adapter/Resolver/UX must not reintroduce circle chord fitting, Y scanning, automatic aesthetic scaling, or runtime geometry repair.
5. Product non-zero geometry does not belong in page CSS; it comes from the resolved Recipe.
6. Product geometry is not rendered before its Recipe plan is ready.
7. Full-bleed scene and safe content are separate concepts.
8. Product Math Engines must be configured by the resolved Recipe/Plan and must not become a second static visual owner or adaptation solver.
9. Feature / Domain / Capability behavior must not move back into pages during visual work.
10. Official health and workout surfaces do not fabricate system health data. Unknown telemetry stays `null`/unavailable until View renders `--`.
11. A value is normalized once at its owner boundary; do not stack Number/clamp/normalize in Capability, Domain, Feature, and View.
12. Breaking V3 persistence uses clean namespaces rather than permanent legacy migration code. Git history preserves retired implementations.
13. Future tooling/templates must not become a second Recipe/Adapter/Device Profile specification.

The final quality result for this refactor should be established by running `npm run check`, building the Vela package, and performing emulator/device regression locally.