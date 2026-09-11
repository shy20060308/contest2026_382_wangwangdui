# vela_band

[简体中文](../README.md) | **English**

`vela_band` is a Xiaomi Vela Quick App wearable reference application, currently at **3.0.0**. A single RPK targets Pill, Circle and Rect wearable form factors. Every manifest route uses the V3 Declarative Surface Runtime.

> This project is for contest demonstrations, architecture validation and wearable UI exploration. It is not medical software. Health surfaces render real Capability/Domain state and explicitly show unavailable values instead of fabricating health data.

## One V3 frontend path

```text
Vela Native APIs → Capabilities → Domain → Feature Controllers
                                          ↓ semantic state/actions
Device Profile → Host Scene → Surface JSON → Surface Runtime → Surface Host → thin page UX
```

Surface JSON owns module order, static copy, colors, typography, spacing, radii and Circle/Pill/Rect variants. Features own business behavior. The generic renderer does not branch on product routes. Page UX files do not own product markup or styling. The current tree has no `src/v2`, page-specific `product/design/apps`, or specialized watchface UX tree.

See [V3 Design Runtime](ARCHITECTURE_V3.md), [Frontend Authority](V3_FRONTEND_AUTHORITY.md), and [Owner Guide](PROJECT_OWNER_GUIDE.md).

## Source layout

```text
src/
├── capabilities/              # native Vela capability boundary
├── domain/                    # business state, state machines, persistence
├── product/
│   ├── features/              # feature controllers
│   ├── design/                # generic Scene / Adapter only
│   └── frontend/
│       ├── surfaces/          # one visual Surface JSON per manifest route
│       └── runtime/           # generic Surface Runtime
├── runtime/                   # Page / Device / Navigation / Power / Haptics
├── components/surface_host.ux # single product renderer
├── pages/                     # thin Surface page shells
└── common/logo.png            # manifest icon
```

## Development

Requires Node.js 18+, npm, AIoT-IDE or a compatible Vela Quick App toolchain, and the contest-required Vela target environment.

```bash
npm ci
npm run check
npm run build
```

For watch/debug mode:

```bash
npm run start
```

Core V3 gates:

```bash
npm run v3:architecture
npm run v3:design
npm run v3:surfaces
npm run v3:frontend-contract
npm run v3:truth
```

`npm run check` directly includes the strict frontend authority contract. Repository tests do not replace RPK installation and smoke testing on the contest beta image; runtime conclusions still require a local build and target simulator/device verification.
