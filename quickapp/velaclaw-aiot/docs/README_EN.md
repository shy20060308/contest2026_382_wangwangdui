# vela_band

**English** | [简体中文](../README.md)

`vela_band` is a Xiaomi Vela Quick App reference project for smart bands and watches. The current project version is **3.0.0** and uses a Recipe-first V3 design runtime to support Pill, Circle, and Rect wearable form factors in one RPK.

> This project is for contest demos, architecture validation, and wearable UI exploration. It is not medical software or production firmware. Official health surfaces only promote official live health samples; unavailable capabilities must be shown as waiting/unavailable rather than replaced with fabricated health trends.

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
UX
```

Responsibilities are strict:

- Capabilities wrap native Vela APIs and device capability boundaries.
- Domain owns business state, state machines, and persistence semantics, not screen geometry.
- Feature Controllers orchestrate lifecycle and product behavior, not layout.
- Device Profile declares form factor, dimensions, and explicit safe insets.
- Recipe owns visual intent, geometry, typography, spacing, form-factor differences, and visual constraints.
- Adapter translates Recipe data only; it does not scan, scale, clamp, fit, or invent geometry.
- Resolvers only compose Recipe data that cannot be represented statically; they do not repair a Recipe.
- UX renders after the resolved plan is ready and does not retain private non-zero geometry fallbacks.
- `src/common` is a static-resource namespace only; runtime logic must not return there.

See [V3 Design Runtime](ARCHITECTURE_V3.md) and [Project Owner Guide](PROJECT_OWNER_GUIDE.md).

## Current product surfaces

| Area | Current implementation |
| --- | --- |
| Watchfaces | Sport / Simple / Dashboard plus Circle Mechanical and Pill Alpine; layout comes from the Clock Recipe |
| Launcher | Circle honeycomb, Pill paged list, Rect designed grid |
| Health | Heart rate, SpO2, stress, window trends, and source provenance |
| Activity & History | Today activity and seven-day persisted trends |
| Workout | Walk/run, pause/resume, official heart rate, location capability, workout history |
| Today | Date, lunar calendar, activity summary, and month calendar |
| Notifications | Local/system-event demos, call state, and haptic feedback |
| Sync | Business payload, packets, ACK progress, and mock transport |
| Settings | Brightness, vibration, sync, motion diagnostics, capability diagnostics |
| Power | ACTIVE / DIM / SLEEP runtime with display, heart-rate, and battery orchestration |

## Source layout

```text
src/
├── capabilities/          # native Vela capability gateways
├── domain/                # business state, state machines, persistence
├── runtime/               # independently executable runtime cores (currently mainly Power)
├── v2/
│   ├── app/               # page runtime, navigation, routes
│   ├── system/            # device profile and system orchestration
│   ├── features/          # feature controllers
│   └── design/            # V3 Scene / Recipe / Adapter / Resolver / Engine
├── pages/                 # product pages; plan binding + feature state + interaction
├── components/watchfaces/ # watchface renderers driven by Clock Recipe data
└── common/                # static images, icons, and watchface assets only
```

`src/v2` is a current source path and does not mean that V3 keeps V2 runtime compatibility. V3 does not retain the old Design Specs, Design Views, Geometry solver, or Presentation runtime.

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
npm run studio:check
```

`v3:architecture` rejects retired runtime/compatibility layers, runtime code under `src/common`, unresolved dependencies, product routes that bypass strict Recipe ownership, and hidden layout ownership regressions. `v3:design` resolves the current app designs against Circle, Pill, and Rect profiles.

## V3 design rules

1. Do not restore `src/presentation`.
2. Do not restore `src/v2/design/specs`, `src/v2/design/views`, or `geometry.js`.
3. Safe area is not recalculated from component width.
4. Adapter/Resolver/UX must not reintroduce circle chord fitting, Y scanning, automatic aesthetic scaling, or runtime geometry repair.
5. Product non-zero geometry does not belong in page CSS; it comes from the resolved Recipe.
6. Product geometry is not rendered before its Recipe plan is ready.
7. Full-bleed scene and safe content are separate concepts.
8. Feature / Domain / Capability behavior must not move back into pages during visual work.
9. Official health and workout surfaces must not fabricate system health data.
10. Git history is the compatibility layer; retired implementation paths do not stay in the runtime tree.

The final quality result for this refactor should be established by running `npm run check`, building the Vela package, and performing emulator/device regression locally.
