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

CI (`.github/workflows/ci.yml`, Node 24) gates PRs to `main` on **build + prettier-check + eslint + typecheck**.
Run `/check` before pushing.

## Style

- Prettier: single quotes, semicolons, width 120, 2-space, `trailingComma: es5`, `arrowParens: always`.
  Import order is enforced (`@ianvs/prettier-plugin-sort-imports`): react → next → third-party → `@/*` → relative → css.
- Path alias `@/*` → `src/*`.
- ESLint: `unused-imports/no-unused-imports` is an **error**; `@typescript-eslint/no-explicit-any` is a warn — don't add `any`.
- User-facing strings: never hardcode. `defineMessages('namespace', { key: 'English' })`, then `/i18n`. `en`/`fr` only.

## Architecture

- **Layering:** `src/app` (RSC pages) → `src/backend/services/**/actions.ts` (`'use server'` thin wrappers) →
  **Service** classes (business logic, own the Firestore transactions) → **Repository** classes
  (`src/backend/repositories`, data access only) → `src/firebase/admin.ts` (firebase-admin). `src/models` is shared by both sides.
- The backend uses **firebase-admin** (`src/firebase/admin.ts` — `adminDb()`, `adminAuth()`, `adminStorageBucket()`),
  a trusted context that bypasses security rules (prod rules are `allow read: if true; allow write: if false`).
  The Firebase **client** SDK is frontend-only (realtime `onSnapshot` listeners). `next.config.ts` externalizes
  `firebase-admin`/`@google-cloud/*`/`grpc`/`pino` from the server bundle.
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
- `src/backend/repositories/FirebaseRepository.ts` / `FirebaseDocumentRepository.ts` — repo base classes
- `src/models/**` — domain models + `game-type.ts` / `question-type.ts` / `round-type.ts` enums + factories
- `src/firebase/admin.ts` — firebase-admin init + emulator wiring; `src/firebase/firebase.ts` — client SDK
  init (frontend only). Both keyed off `NEXT_PUBLIC_USE_EMULATORS`
- `src/backend/config/index.ts` — env-driven config
- `src/frontend/hooks/firestore/**` — the Query + snapshot data layer
- `src/frontend/i18n/` — `defineMessages.ts`, `locale/{en,fr}.json`, `update-i18n.mjs`
- `next.config.ts` — React Compiler, `serverExternalPackages`, 4 MB server-action body limit
- `README.md` — full emulator setup + ports (Firestore 8080, RTDB 9000, Storage 9199, UI 4000)

## Gotchas

- `dev:emulators` is flaky locally: crashes / leaves stray processes on the emulator ports (`preemulators`
  only frees 8080/9000). Use `/emulators` for a clean restart; don't rabbit-hole debugging it for one-off checks.
- No MCP servers are configured for this repo.
