# CLAUDE.md

**Pop!** (package `qpc`) — real-time multiplayer quiz game. Next.js 16 App Router (React 19,
React Compiler on) + Firebase (Firestore, Realtime DB, Storage) + NextAuth. TypeScript `strict`.
14 question types, role-based play (organizer / player / spectator).

## Commands

| Command                    | Use                                                                    |
| -------------------------- | --------------------------------------------------------------------- |
| `npm run dev`              | Dev server against **production** Firebase                            |
| `npm run dev:emulators`    | Emulators + dev server, local data (`npm run seed` first run) — flaky, see below |
| `npm run typecheck`        | `tsc --noEmit`                                                        |
| `npm run eslint` / `:fix`  | `eslint src --ext .ts,.tsx`                                           |
| `npm run prettier-check` / `prettier-write` | Formatting                                          |
| `npm run build`            | Production build                                                     |
| `npm run update-i18n`      | Regenerate `en.json` + re-sort `fr.json` from `defineMessages()` calls |
| `npm run deploy:rules`     | Deploy prod Firestore/RTDB/Storage rules (`firebase.prod.json` → `firebase/*.prod.rules`) |

CI (`.github/workflows/ci.yml`, Node 24, Linux) gates PRs to `main` on **build + prettier-check + eslint + typecheck**.
Run `/check` before pushing. On Windows with `core.autocrlf=true`, `npm run prettier-check` flags the
whole working tree (CRLF ≠ prettier's LF) — check individual changed files with `npx prettier --check <file>`
and trust CI for the tree-wide pass.

## Style

- Prettier: single quotes, semicolons, width 120, 2-space, `trailingComma: es5`, `arrowParens: always`.
  Import order is enforced (`@ianvs/prettier-plugin-sort-imports`): react → next → third-party → `@/*` → relative → css.
- Path alias `@/*` → `src/*`.
- ESLint: `unused-imports/no-unused-imports` is an **error**; `@typescript-eslint/no-explicit-any` is a warn — don't add `any`.
- User-facing strings: never hardcode. `defineMessages('namespace', { key: 'English' })`, then `/i18n`. `en`/`fr` only.

## Architecture

- **Backend → Go migration in progress.** `src/backend/**` is being replaced by a standalone Go
  service in the sibling repo `../back-pop` (plan: `~/.claude/plans/back-pop-migrating-majestic-corbato.md`,
  not in either repo). Landed on branch `phase-7-auth-bridge`: a Firebase auth bridge
  (`src/app/api/auth/firebase-token/route.ts` + `src/app/FirebaseAuthProvider.tsx`) and a typed API
  client (`src/frontend/api/` — `apiFetch` + one fn per Go endpoint, `next.config.ts` `rewrites`
  `/api/backend/*` → `BACKEND_ORIGIN`). **No call sites use `@/frontend/api` yet** — every feature
  still runs through `src/backend/services/**/actions.ts` below. Swapping call sites group by group
  is the next phase.
- **Layering:** `src/app` (RSC pages) → `src/backend/services/**/actions.ts` (`'use server'` thin wrappers) →
  **Service** classes (business logic, own the Firestore transactions) → **Repository** classes
  (`src/backend/repositories`, data access only) → `src/firebase/admin.ts` (firebase-admin). `src/models` is shared by both sides.
- The backend uses **firebase-admin** (`src/firebase/admin.ts` — `adminDb()`, `adminAuth()`, `adminStorageBucket()`),
  a trusted context that bypasses security rules. Prod Firestore rules are `allow write: if false` everywhere
  (admin SDK only); reads are scoped per collection (`firebase/firestore.prod.rules`) — `games/**` read-open
  for the client's `onSnapshot` listeners; `questions/**` and `users/**` fully denied (client uses the
  `getPlayableQuestion` / `getEditableQuestion` / `getPublicUsersByIds` server actions). `firebase/firestore.rules`
  mirrors the read scoping for the emulator.
  The Firebase **client** SDK is frontend-only (realtime `onSnapshot` listeners). `next.config.ts` externalizes
  `firebase-admin`/`@google-cloud/*`/`grpc`/`pino` from the server bundle.
- **Admin SDK vs client SDK gotchas** (the two base repos already handle these): `docSnap.exists` is a
  **property**, not `exists()`. `getByQueryTransaction` runs a **real transactional query** now, so a query
  read after any write in the same callback throws "reads must precede writes" — hoist reads up (see
  `RoundService.endRoundTransaction`). Storage uploads go through `adminStorageBucket()` and rebuild the
  `?token=` download URL by hand.
- **Firebase project config** lives in `firebase/` (`*.rules`, `*.prod.rules`, `firestore.indexes.json`).
  `firebase.json` (emulator), `firebase.prod.json` (prod deploy target for `deploy:rules`), and `.firebaserc`
  stay at repo root. `.firebaserc` aliases: `default` → `demo-pop` (emulator), `prod` → `qpc-app`.
- **Per-type polymorphism:** `QuestionType` / `RoundType` enums + `*Factory` classes switch on the enum
  (`QuestionFactory`, `GameQuestionServiceFactory`, `RoundServiceFactory`, repo factories). Adding a type
  touches ~15 files across every layer — use `/add-question-type`.
- **`runTransaction` footgun:** the callback re-runs on write contention. Only `transaction.*` writes replay
  safely. A non-`*Transaction` repo write (plain `updateDoc`, `writeBatch`, `increment`, sound-queue push…)
  inside the callback fires once per retry — this caused the Matching triple-submit bug (`git show 91e466c`).
  Under firebase-admin + the emulator such a write also *deadlocks* (pessimistic locks). Convention:
  `fooTransaction(transaction, …)` does the tx work; `foo(…)` opens the tx and runs post-commit side effects.
  Whole-team player-`status` fan-out is deferred past the commit via `PendingStatusChanges`
  (`src/backend/services/pendingStatusChanges.ts` — `pendingStatus.runTransaction(fn)` + `enqueueTeam*`), wired
  into the question/round/game service bases. Other non-tx side effects (sound-queue, counters) may still be
  latent — `/audit-transactions`.
- **Frontend data:** TanStack Query over Firestore. `useFirestoreDocument`/`useFirestoreCollection` =
  one `useQuery` (`staleTime: Infinity`) + a shared `onSnapshot` pushed into the cache. Listeners are deduped
  per doc/query path (`acquireSharedSubscription`) to avoid double billing. (Migrated off react-firebase-hooks.)
- **Base questions (`questions/{id}`) are never read from the client** — the rule is `allow read: if false`.
  In-game: `usePlayableQuestion` → `getPlayableQuestion` action → `PlayableQuestionService`, which returns
  `Question.toPlayableObject()` (per-type override that strips answer fields) for players/spectators and the
  full `toObject()` for organizers / once the question has ended. Progressively-revealed types (clues,
  labelling, quote, enumeration, nagui) re-add pieces from live game state in the service, and
  `usePlayableQuestion` keys its cache on `gameStatus` + `isCurrentQuestion` + a per-type reveal signature.
  Editor: `useEditableQuestions` → organizer-gated `getEditableQuestions` (one batched request per round).
  **`matching` is not redacted yet** — its answer still ships in the `getPlayableQuestion` response
  (see `.claude/plans/firestore-read-scoping.md`).
- **Game view state** comes via contexts, not props/refetch: `useGame`, `useRole`, `useTeamId`,
  `useUser`/`useUserId`, `useActiveQuestion`.
- **Action buttons:** wrap the server action in `useAsyncAction` — it has a ref-based re-entrancy guard for
  double/triple clicks (don't rely on `isLoading` alone).
- **Logging:** Pino. `import { logger } from '@/backend/logger'`; every service/repo builds a
  `logger.child({ module, game, round })`. pino-pretty in dev, JSON in prod. `LOG_LEVEL` env.
- **UI:** shadcn/ui (`base-nova` style, Base UI primitives) in `src/frontend/components/ui` — generated,
  don't hand-edit casually. `cn()` from `@/frontend/lib/utils`. Icons: `lucide-react`. Tailwind v4 (CSS-config,
  `src/app/globals.css`).
- **Forms:** react-hook-form + `@hookform/resolvers` + Yup; wired fields in
  `components/common/ReactHookFormComponents.tsx`. Older submit forms still use Formik — migration in progress.

## Core files

- `src/backend/services/question/GameQuestionService.ts` — base for all in-game question services
- `src/backend/services/question/PlayableQuestionService.ts` + `playable-actions.ts` /
  `EditableQuestionService.ts` + `editable-actions.ts` — server-side base-question reads (client rules deny `questions/**`)
- `src/backend/repositories/FirebaseRepository.ts` / `FirebaseDocumentRepository.ts` — repo base classes
- `src/models/**` — domain models + `game-type.ts` / `question-type.ts` / `round-type.ts` enums + factories
- `src/firebase/admin.ts` — firebase-admin init + emulator wiring; `src/firebase/firebase.ts` — client SDK
  init (frontend only). Both keyed off `NEXT_PUBLIC_USE_EMULATORS`
- `src/backend/config/index.ts` — env-driven config
- `src/frontend/hooks/firestore/**` — the Query + snapshot data layer
- `src/frontend/i18n/` — `defineMessages.ts`, `locale/{en,fr}.json`, `update-i18n.mjs`
- `src/backend/services/pendingStatusChanges.ts` — defer whole-team `status` writes past a transaction commit
- `next.config.ts` — React Compiler, `serverExternalPackages`, 4 MB server-action body limit
- `firebase/` — Firestore/RTDB/Storage rules + indexes; `firebase.json` / `firebase.prod.json` / `.firebaserc` at root
- `README.md` — full emulator setup + ports (Firestore 8080, RTDB 9000, Storage 9199, UI 4000)

## Gotchas

- `dev:emulators` is flaky locally: crashes / leaves stray processes on the emulator ports (`preemulators`
  only frees 8080/9000). Use `/emulators` for a clean restart; don't rabbit-hole debugging it for one-off checks.
- No MCP servers are configured for this repo.
