---
description: Audit a Service for the runTransaction retry/deadlock footgun
argument-hint: "[path or service name — default: all game services]"
---

`adminDb().runTransaction(cb)` (usually via the `this.pendingStatus.runTransaction(fn)` wrapper) re-runs `cb`
on write contention. Only `transaction.get/set/update/delete/create` participate in the transaction and replay
safely. A **non-transactional** write inside the callback is unsafe two ways:

- **Replay:** it fires once per attempt — this caused the Matching triple-submit bug (`git show 91e466c`).
- **Deadlock:** a standalone `adminDb().batch()` / `ref.set|update|delete` / `col.add` on a doc the open
  transaction has locked hangs against the emulator's pessimistic lock manager → `Transaction lock timeout`.

Also: every `transaction.get(...)` — including `getByQueryTransaction` / `getByFieldTransaction`, now real
transactional queries — must run **before** any write in the same callback, or it throws "reads must precede
writes".

Audit: **${ARGUMENTS:-every service under `src/backend/services`}**

1. Find every `runTransaction(` / `pendingStatus.runTransaction(` call and the callback it runs.
2. Trace the callback and everything it `await`s, transitively, for:
   - direct `firebase-admin/firestore` writes other than `transaction.*` — `ref.set/update/delete`,
     `col.add`, `adminDb().batch()`
   - repo method calls whose name does **not** end in `Transaction` (they open their own read/write)
   - non-idempotent side effects: sound-queue pushes, `FieldValue.increment()` outside `transaction.*`,
     player-status fan-out, timers, anything external
   - a `transaction.get` / `*Transaction` read that runs after a write in the same callback
3. For each hit: report `file:line`, which failure mode (replay / deadlock / read-after-write), and the fix —
   collect intent during the tx and apply it after `runTransaction` resolves. For whole-team player `status`
   that is `PendingStatusChanges` (`src/backend/services/pendingStatusChanges.ts`): `enqueueTeam` /
   `enqueueTeamAndOthers` during the tx, flushed post-commit.
4. Already routed through `PendingStatusChanges`: player-status fan-out in `services/question/{matching,mcq,nagui}`
   and the `{MCQ,Matching,Nagui,OddOneOut}RoundService` / `GameService.startGame`. Re-check those for *other*
   deferred-but-not side effects, and audit `SoundRepository.clearSounds` (non-tx `getAll()` + delete loop).

Report findings only; don't edit unless I ask.
