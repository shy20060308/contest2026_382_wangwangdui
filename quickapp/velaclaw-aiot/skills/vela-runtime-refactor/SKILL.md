---
name: vela-runtime-refactor
description: Repair or refactor Vela wearable runtime/data/lifecycle code while preserving accepted product semantics, truthful data, async ownership, page-local Surface authority, and measurable rollback-safe behavior.
---

# vela-runtime-refactor

Use this skill for correctness fixes, lifecycle/resource ownership, persistence, capability gateways, routing, controller/runtime refactors, protocol work, and performance optimization where accepted UI/business semantics must remain stable.

Do not use it to redesign visual hierarchy or form-factor composition unless that redesign is explicitly part of the task; presentation design belongs to `vela-surface-design`.

## Required inputs

Before changing code, pin the exact branch/SHA and read the smallest connected flow:

- entry page / controller;
- Domain store/state machine/repository;
- capability gateway and native callback ownership;
- relevant Surface action/binding contract;
- persistence/protocol namespace if any;
- existing behavior tests and architecture contracts;
- current device evidence status.

Never infer device support from a declaration or build. Record whether the claim is repository-only or device-proven.

## Core invariants

1. **Truthful data** — elapsed time, demo fixtures, stale caches and fallback values never masquerade as measured health/workout data.
2. **Exactly-once business effect** — retry, crash/restart and duplicate UI action must not duplicate durable records or partial projections.
3. **Async owner** — every page instance, subscription, timer, transfer and native callback belongs to an explicit generation/token/owner.
4. **Late callbacks are harmless** — stop/destroy/restart invalidates old callbacks before native cancellation.
5. **Surface authority** — runtime/controller code outputs semantics, not page copy/color/shape layout.
6. **Fail visibly at the right layer** — invalid authored config fails build; programming errors fail during development; corrupt user persistence becomes recoverable state.
7. **No destructive recovery by default** — corrupt persistence is preserved/quarantined before reset; I/O failure does not trigger deletion.
8. **Router failure is retryable** — dedupe state is committed only after the route invocation has succeeded.
9. **Performance claims require measurement** — static dependency size, plan primitives and JS timing are not FPS/RAM/power evidence.
10. **One root-cause batch at a time** — do not mix a controller split, storage migration and visual redesign into one unreviewable change.

## Workflow

### 1. Pin and reproduce

Record:

- branch and head SHA;
- problem/F number if available;
- old behavior;
- minimum reproduction sequence;
- evidence level: source-control proof, executable behavior test, or device-only.

Prefer a deterministic executable reproduction before implementation. If the effect needs native behavior, create the strongest mock/order fixture possible and label remaining device proof.

### 2. Draw ownership and durability boundaries

For the affected path, identify:

- canonical semantic state owner;
- persisted canonical record/key;
- derived projections;
- native resources/subscriptions;
- page owner/generation;
- timers and timeout owner;
- route transition owner;
- callbacks that can arrive after stop/destroy.

Do not add a new global registry merely to make ownership easier to reach.

### 3. Define invariants before code

Examples:

- a completed workout ID maps to one stable completed record;
- a stale health timestamp cannot replace a newer accepted timestamp;
- a hidden/destroyed page cannot navigate when an old request finishes;
- a failed router invocation does not poison a duplicate lock;
- corrupt settings cannot be overwritten by defaults until explicit recovery;
- an old native subscription fail callback cannot stop a new native owner.

Write the assertions in product terms, not only as source-string expectations.

### 4. Choose the smallest closing protocol

Examples from this project:

- generation token at the actual capability boundary, not only the controller;
- durable `finishedAt` intent before completed Workout record;
- idempotency key = stable workout session ID;
- quarantine raw corrupt storage before reset;
- per-page interaction owner for async navigation;
- structured native desired/applied/error result;
- lazy packet generation instead of payload→pieces→packets duplication.

Do not introduce a generic abstraction unless at least two real paths need it or the abstraction is the actual correctness boundary.

### 5. Handle all failure windows

For persistence/protocol changes, enumerate every boundary where execution can stop:

- before native call;
- native operation fails synchronously;
- native fail callback;
- operation succeeds but callback is lost;
- callback arrives after watchdog timeout;
- application restarts after each durable step;
- user repeats the action;
- a second operation starts while an old callback is still pending.

For each window, state what durable data remains and how the next attempt proceeds.

### 6. Test behavior, then architecture

Prefer real pure-core/store/controller behavior tests with fake scheduler/repository/capability callbacks. Static source contracts are useful for authority/dependency boundaries, but they must not be the only proof of transactional or lifecycle behavior.

When updating an old static test after a refactor, preserve its intended invariant instead of weakening/removing it because the implementation moved files.

### 7. Build on the same head

Run the project check chain and QuickApp build on the same commit. Do not cite an earlier green run for a later unverified head.

If a failed run reveals a stale test assertion, prove the product behavior first and migrate only the outdated location/shape assumption.

### 8. Separate repository and device conclusions

Repository evidence may close:

- deterministic state-machine transitions;
- generation ownership;
- storage transaction/recovery semantics;
- JSON schema/compile contracts;
- route retry/dedupe rules;
- deterministic geometry preview.

It cannot close:

- native touch propagation;
- actual sensor timestamp cadence/quality;
- native paint/FPS;
- RAM/power behavior;
- required-image install/launch;
- Android companion business ACK.

Use `docs/DEVICE_ACCEPTANCE_CHECKLIST.md` and `docs/PERFORMANCE_BASELINE_TEMPLATE.md` for the device side.

## Specialized checklists

### Persistence / exactly-once

- canonical ID is stable across retry/restart;
- final semantic snapshot/timestamp is frozen once;
- first durable intent precedes destructive cleanup;
- duplicate durable record is accepted only when content matches exactly;
- partial completion remains recoverable;
- timeout/late callback cannot advance a newer operation;
- corrupt persistence is blocked from automatic writes;
- explicit recovery backs up before delete/reset.

### Native subscription ownership

- generation created before subscription;
- callback/fail captures that generation;
- stop invalidates generation before native unsubscribe;
- old callback/fail is ignored;
- last consumer owns native stop when shared;
- timeout belongs to the same generation as the request/subscription.

### Navigation

- transition key includes page owner when appropriate;
- router is invoked before success is recorded in duplicate suppression;
- failed invocation permits immediate retry;
- hidden/destroyed page token cannot route;
- overlay policy is enforced before direct route action.

### Performance

- measure the original bottleneck before large structural optimization;
- distinguish serialize/resolve/decorate/context/native work;
- do not use full-state stringify as the long-term dependency model when measured cost justifies leaf updates;
- prove bundle/loading isolation when splitting controller/resource composition;
- avoid caching complexity without a before/after result.

## Anti-patterns

Never accept these as completion:

- `switch` with all static `require`s described as lazy loading;
- clearing active state before durable record commit;
- reading the current generation inside an old callback instead of capturing its owner;
- nulling a reference without cancelling/invalidating the real native owner;
- send callback success described as peer business ACK;
- default values silently replacing corrupt user persistence;
- lowering a test threshold or deleting a contract to make CI green;
- Node geometry output described as device screenshot acceptance;
- static source dependency bytes described as measured RAM savings;
- mock/sample replay described as real sensor validation.

## Output format

For every completed batch, report:

1. problem and reproduction;
2. root cause and owner/durability boundary;
3. minimal change;
4. behavior contract added/changed;
5. repository check/build evidence and exact SHA;
6. remaining failure window if any;
7. device/companion evidence still required;
8. rollback/migration implications.

Update `docs/EVIDENCE_INDEX.md` for material F/P1 repairs.

## Real project examples to study

- Health/Motion/Location generation ownership for stale native callbacks.
- retry-safe navigation dedupe where failed router invocation does not create a dirty lock.
- Storage keyed-operation watchdog with token rejection of late callbacks.
- corrupt persistence recovery with structured result and quarantine-before-reset.
- Workout `finishedAt` freeze and idempotent record ID across retry/restart.
- Watchface build-time preview truth: runtime cost reduced without creating a second authored visual authority.

## Skill validation status

This file defines the workflow but is not final contest evidence by itself. Before release, use it to redo at least one real lifecycle/correctness repair and one measured performance optimization, record reproduction/change/tests/device evidence, and add those validation runs to `docs/EVIDENCE_INDEX.md`.