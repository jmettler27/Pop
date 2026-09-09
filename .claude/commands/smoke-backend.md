---
description: Bring up the emulators + Go service and run the front↔back API smoke test
allowed-tools: Bash
---

End-to-end check that Pop's API client (`src/api/`) and the Go backend (`../back-pop`) still agree
on every wire shape — the drift `tsc` can't see (`src/api/types.ts` is hand-mirrored from
`back-pop/api/openapi.yaml`). Run it after touching either side of that seam, or after a repo
reshuffle.

Steps:

1. **Free the ports**, then start the **Firebase emulators** in the background (Auth 9099, Firestore
   8080, RTDB 9000, Storage 9199, UI 4000):
   `npx kill-port 8080 9000 9099 9199 4000 8090`
   then `./node_modules/.bin/firebase emulators:start --project demo-pop` (background; wait for
   "All emulators ready").
2. **Seed**: `npm run seed` (seed users alice..frank; the smoke flow itself uses fresh games).
3. **Start the Go service** in the background: `cd ../back-pop && go run ./cmd/server` (or `make run`).
   Wait for the `"listening" ":8090"` log line. `configs/server.yml` already points it at the
   emulators — no env needed.
4. **Run**: `node scripts/smoke-backend.mjs`. It drives the exact payloads `src/api/endpoints.ts`
   sends — createGame (+`organizerName`), the round-structure writes, per-question time, reorder,
   launch, `GET /users`, and two full fresh games (mcq + basic/buzzer) through join → ready → round
   start/select → the per-type + generic question actions → question_end → game end. Exit 0 = all
   green; it prints a `FAILURES:` block otherwise.
5. **Tear down**: `npx kill-port 8080 9000 9099 9199 4000 4400 4500 9150 8090`.

Interpreting failures: a **4xx with a payload-shape message** ("unknown field", "must be", "not one
of", missing required) is real API drift — reconcile `src/api/types.ts` with the current
`back-pop/api/openapi.yaml` (and `pkg/*/http.go`). A **5xx** is a Go bug — check the Go service log.
The emulators are flaky locally; if they won't come up, say so and stop — don't rabbit-hole
(`/emulators` covers a clean restart).

This is the scripted-API pass only. It does **not** exercise the React UI (NextAuth login →
`FirebaseAuthProvider` custom-token exchange → clicking through a game); that still needs a browser.
