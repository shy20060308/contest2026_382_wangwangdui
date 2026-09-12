# Runtime Refactor Failure-Window Checklist

Use this when a change touches persistence, async native callbacks, routing, or protocol state.

## Persistence / transaction

For each durable step, answer all rows before implementation.

| window | durable state before retry | required retry behavior |
|---|---|---|
| before native call | previous canonical state | safe retry |
| synchronous throw | previous canonical state | visible failure, safe retry |
| native fail callback | previous/known partial state | visible failure, safe retry |
| native operation succeeds but callback is lost | operation may have happened | retry must not duplicate/revive old state |
| watchdog fires, old success arrives later | newer operation may already own key | old callback ignored by token |
| process restarts after durable intent | intent survives | resume from next idempotent phase |
| process restarts after record write | record may already exist | identical ID/content accepted once |
| cleanup succeeds but acknowledgement is lost | canonical record exists, cleanup may be absent | retry must not recreate deleted intent |

For Workout specifically, a finalized `finishedAt` is durable intent. Once the finalized intent already exists, retry must not rewrite it merely to continue record/cleanup phases.

## Native subscription / timer

- [ ] owner/generation allocated before starting native work;
- [ ] callback and fail closures capture that exact owner;
- [ ] stop invalidates owner before native unsubscribe/stop;
- [ ] timeout closure captures the same owner;
- [ ] old callback cannot mutate current semantic state;
- [ ] old fail cannot stop a new subscription;
- [ ] late timeout cannot mark a resumed/restarted operation failed;
- [ ] final consumer releases the native resource.

## Page / navigation

- [ ] page instance has an interaction/lifecycle owner;
- [ ] hide/destroy invalidates asynchronous routing permission;
- [ ] direct route action passes current overlay/power policy;
- [ ] duplicate suppression is recorded only after router invocation succeeds;
- [ ] router throw permits immediate identical retry;
- [ ] back suppression is owner-scoped.

## Structured user-data failure

- [ ] missing data is distinct from corrupt data;
- [ ] corrupt syntax and valid-JSON/invalid-domain schema are both detected;
- [ ] I/O error is distinct from corrupt data;
- [ ] corrupt key is blocked from automatic overwrite;
- [ ] recovery is explicit;
- [ ] original raw content is persisted to quarantine before delete/reset;
- [ ] I/O error does not trigger destructive recovery;
- [ ] legacy compatible data is migrated/read intentionally rather than silently discarded.

## Protocol / sync

- [ ] transfer has its own token/epoch separate from page lifecycle;
- [ ] sent set is frozen for the transfer;
- [ ] sequence/total/transferId/version validated;
- [ ] encoding budget uses actual protocol bytes, not JS string code units;
- [ ] peer business ACK is separate from local send callback;
- [ ] only ACK-confirmed record versions are marked synced;
- [ ] timeout/retry is finite and old callbacks cannot advance a new transfer;
- [ ] malformed/unrelated envelope does not become a notification or crash another consumer.

## Evidence

For every repaired failure window record:

- old reproduction;
- new executable behavior assertion when possible;
- source SHA;
- CI run on that SHA;
- QuickApp build status;
- simulator/device/peer evidence still required.
