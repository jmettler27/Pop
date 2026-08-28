---
description: (Re)start the Firebase emulators cleanly, around the local flakiness
allowed-tools: Bash
---

`npm run dev:emulators` is flaky locally — it can crash or leave stray processes holding the emulator ports
(`preemulators` only frees 8080/9000). For a clean start:

1. Free every port it touches: `npx kill-port 8080 9000 9199 4000 3000`
2. Start it in the background: `npm run dev:emulators` (runs the Firebase Emulator Suite + `next dev` with
   `NEXT_PUBLIC_USE_EMULATORS=true` via `concurrently`).
3. First run only, once the emulators report ready: `npm run seed`.
4. App → http://localhost:3000, Emulator UI → http://localhost:4000.

If it still won't come up, report exactly what failed and stop — don't rabbit-hole. Emulator data persists in
`emulator-data/` (git-ignored) via `--export-on-exit`.
