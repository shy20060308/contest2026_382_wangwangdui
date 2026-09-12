# vela_band

[简体中文](../README.md) | **English**

`vela_band` is a Xiaomi Vela Quick App wearable reference application, currently at **3.0.0**. One RPK targets Pill, Circle and Rect wearable form factors. The current manifest contains **17 routes**, all using the V3 Declarative Surface Runtime.

> This project is for contest demonstrations, architecture validation and wearable UI exploration. It is not medical software. Health surfaces render confirmed Capability/Domain state and explicitly show unavailable values instead of fabricating health data.

## One V3 frontend path

```text
Vela Native APIs → Capabilities → Domain → Feature Controllers
                                          ↓ semantic state/actions
Device Profile → Host Scene → page-local Surface JSON
                               ↓
                   Surface / Stage / Experience Runtime
                               ↓
                   generic Surface Host / Components
                               ↓
                         thin page UX
```

Surface JSON owns module order, static copy, visual tokens, shape/face variants and declared actions. Features own business semantics. Generic renderers do not own route-specific presentation. Generated metadata/watchface previews are derived build artifacts, not a second authored visual source.

See [V3 Design Runtime](ARCHITECTURE_V3.md), [Frontend Authority](V3_FRONTEND_AUTHORITY.md), and [Owner Guide](PROJECT_OWNER_GUIDE.md).

## Current product behavior

- Watchfaces: Sport / Simple / Dashboard, Circle Mechanical and Pill Alpine; selector previews are compiled from Clock Stage truth.
- Launcher: Circle Honeycomb, Pill paged list and Rect grid.
- Health: heart rate / oxygen / stress with explicit unavailable state and truthful recent-window semantics.
- Activity/history: canonical daily activity and real records in the latest seven-calendar-day window.
- Workout: walk/run, pause/resume, GPS distance, official live heart rate, stable finalized intent and idempotent completed records.
- Notifications: local notification/call demonstrations; current call-end action does not promise remote phone ACK.
- Settings/Diagnostics: brightness, vibration, motion/device diagnostics and explicit persistence recovery state.
- Sync: Interconnect/lazy packet foundation; true peer business ACK / Android companion closure is still pending.

## Source layout

```text
src/
├── capabilities/              # native Vela capability boundary
├── domain/                    # canonical business state, state machines, persistence
├── product/
│   ├── features/              # feature controllers
│   ├── design/                # generic Scene/Profile helpers
│   └── frontend/
│       ├── surfaces/          # authored Surface JSON for 17 routes
│       ├── runtime/           # generic Surface / Stage / Experience Runtime
│       └── generated/         # derived metadata/watchface preview artifacts
├── runtime/                   # Page / Device / Navigation / Power / Haptics
├── components/                # generic Surface Host / Collection / Slider / Preview
├── pages/                     # thin Surface page shells
└── common/logo.png            # manifest icon
```

## Target and development

`src/manifest.json` currently declares `minAPILevel: 2`, `minPlatformVersion: 1000` and `designWidth: 192`.

Contest simulator/device acceptance uses the required image:

```text
vela-miwear-watch-5.0(开发者大赛)
```

The audit plan requires aiot-core / aiot-emulator 1.7.22+; record the actual versions used for final evidence.

Requires Node.js 18+, npm, and AIoT-IDE or a compatible Vela Quick App toolchain.

```bash
npm ci
npm run check
npm run build
```

For watch/debug mode:

```bash
npm run start
```

Core V3 gates include:

```bash
npm run v3:architecture
npm run v3:design
npm run v3:surfaces
npm run v3:schema
npm run v3:frontend-contract
npm run v3:truth
```

Repository contracts and QuickApp build do not replace installation, launch, native touch, sensor, memory, FPS or power validation on the required contest image.

## Acceptance / evidence

- [Simulator / device checklist](DEVICE_ACCEPTANCE_CHECKLIST.md)
- [Performance baseline template](PERFORMANCE_BASELINE_TEMPLATE.md)
- [Repair / validation evidence index](EVIDENCE_INDEX.md)

Final release SHA, RPK hash, screenshots, performance samples and smoke results must refer to the same frozen build.
