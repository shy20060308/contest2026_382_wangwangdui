# vela_band

[简体中文](../README.md) | **English**

`vela_band` is a Xiaomi Vela Quick App wearable application, currently at **3.0.0**. One RPK covers Circle, Pill and Rect wearable form factors. `src/manifest.json` contains **17 routes** and all 17 pages run through the V3 Declarative Surface Runtime with a one-to-one authored Surface JSON mapping.

Surface JSON is the human-readable design source of truth for product presentation and interaction. Thin page shells own lifecycle and action bridging only; Feature / Domain / Capability layers provide business state; generic runtime, engines and UX components interpret the design without owning route-specific product presentation.

> Health, workout, sensor, battery and connection surfaces consume real Capability / Domain data. Missing capability data is rendered as missing, unavailable or error state rather than fabricated health or workout values.

## Product capabilities

| Area | Implementation |
|---|---|
| Clock | Sport, Simple, Dashboard, Mechanical and Alpine faces; horizontal face switching, swipe-up launcher, long-press selector, notification/call/display overlays |
| Launcher | Circle Honeycomb, Pill paged list and Rect grid |
| Health | Heart rate, oxygen, stress, recent-sample window, availability and timestamp state |
| Activity / History | Daily activity, day rollover, seven-calendar-day window, missing-data state and persistence recovery |
| Workout | Walk/run, pause/resume, GPS, live heart rate, completed records, idempotent recovery and workout history |
| Today | Daily summary and calendar |
| Notification | Notification/call demo, overlay interaction priority and haptics |
| Sync | Interconnect connection, packetized transfer, progress, failure state and retry |
| Settings | Brightness, auto brightness, raise-to-wake, vibration, sync, motion/device/storage diagnostics |
| Power | ACTIVE / DIM / ambient-like display policy with page, timer and sensor lifecycle coordination |

## V3 architecture

```text
Vela Native APIs
      ↓
Capabilities → Domain → Feature Controllers
                            ↓ semantic state/actions
Device Profile → Host Scene → Surface JSON
                            ↓
                 Surface / Stage / Experience Runtime
                            ↓
                  Generic Surface Host / Components
                            ↓
                       Thin Page Shell
```

Core rules:

- `src/manifest.json` is the route source of truth.
- `src/product/frontend/surfaces/*.json` owns static copy, visual tokens, module structure, bindings, actions, shape variants and experience selection.
- `src/product/frontend/adaptation-policy.json` declares L1 shared-expression, L2 local-expression and L3 independent-surface adaptation depth.
- Circle, Pill and Rect are not forced into the same layout. L3 surfaces may select a generic experience/engine such as Honeycomb.
- `src/product/frontend/runtime/*`, `src/product/frontend/engines/*` and `src/components/*` implement reusable primitives, compositions and interaction algorithms only.
- `src/pages/**/*.ux` remains a thin shell and does not own product markup, visual tokens or business state machines.
- The current source tree does not keep `src/v2`, the retired presentation tree, page-specific `product/design/apps`, or a dedicated watchface UX tree.

See [V3 Architecture](ARCHITECTURE_V3.md), [Frontend Authority](V3_FRONTEND_AUTHORITY.md), and [Owner Guide](PROJECT_OWNER_GUIDE.md).

## Source layout

```text
quickapp/velaclaw-aiot/
├── src/
│   ├── capabilities/              # native Vela capability boundary
│   ├── domain/                    # canonical business state, state machines, persistence
│   ├── product/
│   │   ├── features/              # feature controllers
│   │   ├── design/                # generic Scene / Adapter
│   │   └── frontend/
│   │       ├── surfaces/          # authored Surface JSON for 17 routes
│   │       ├── runtime/           # generic Surface / Stage / Experience Runtime
│   │       ├── engines/           # reusable L3 interaction algorithms
│   │       └── generated/         # derived metadata / previews
│   ├── runtime/                   # Page / Device / Navigation / Power / Haptics
│   ├── components/                # generic Surface Host / Collection / Slider / Preview
│   ├── pages/                     # thin page shells
│   └── common/                    # manifest icon and static resources
├── scripts/                       # Surface compiler and audits
├── test/                          # behavior, architecture, persistence and interaction contracts
├── docs/                          # architecture, maintenance, acceptance, performance and evidence
└── skills/                        # reusable AI Coding skills
    ├── vela-surface-design/
    └── vela-runtime-refactor/
```

## Target environment

`src/manifest.json` declares:

```text
package: com.application.watch.demo
minAPILevel: 2
minPlatformVersion: 1000
designWidth: 192
entry: pages/clock
```

Contest device acceptance uses the required image:

```text
vela-miwear-watch-5.0(开发者大赛)
```

The toolchain uses aiot-core / aiot-emulator 1.7.22+. The actual acceptance versions are recorded with device evidence.

## Development and build

Requires Node.js 18+, npm, and AIoT-IDE / Vela Quick App tooling.

```bash
npm ci
npm run check
npm run build
```

Debug:

```bash
npm run start
```

Release:

```bash
npm run release
```

Core V3 gates:

```bash
npm run v3:architecture
npm run v3:design
npm run v3:adaptation
npm run v3:surfaces
npm run v3:schema
npm run v3:frontend-contract
npm run v3:frontend-runtime
npm run v3:performance
npm run v3:interaction-parity
npm run v3:truth
npm run v3:package-hygiene
```

`npm run check` also covers capability, device profile, interaction/async ownership, storage, sync, power, health, history, workout, activity, settings, motion, haptics and calendar contracts.

## Skills

Project skills live independently under `skills/`, not under `docs/`:

- [`vela-surface-design`](../skills/vela-surface-design/SKILL.md): new page/watchface design, Surface JSON, visual hierarchy and Circle/Pill/Rect adaptation.
- [`vela-runtime-refactor`](../skills/vela-runtime-refactor/SKILL.md): correctness fixes, lifecycle/resource ownership, persistence, protocol work, refactors and performance optimization.

Both skills use the repository's Surface authority, truthful-data rules, invariants and verification chain, with their own references / fixtures.

## Acceptance and performance

Device, performance and release evidence is recorded in:

- [Device acceptance](DEVICE_ACCEPTANCE_CHECKLIST.md)
- [Performance baseline](PERFORMANCE_BASELINE_TEMPLATE.md)
- [Validation evidence](EVIDENCE_INDEX.md)

Repository contracts, QuickApp builds, deterministic geometry checks and JS timings remain separate evidence classes. Measurements that require the target device are filled only for the matching source SHA / RPK.