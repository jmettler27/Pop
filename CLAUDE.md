# CLAUDE.md

**Pop!** (package `qpc`) — real-time multiplayer quiz game. Next.js 16 App Router (React 19,
React Compiler on) + Firebase (Firestore, Realtime DB, Storage) + NextAuth. TypeScript `strict`.
14 question types, role-based play (organizer / player / spectator).

## Commands

| Command                                     | Use                                                                                              |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `npm run dev`                               | Dev server; **production** Firebase for `onSnapshot`, no backend (API calls fail)                |
| `npm run dev:emulators`                     | Emulators + dev server, local data (`npm run seed` first run) — flaky, see below                 |
| `npm run typecheck`                         | `tsc --noEmit`                                                                                   |
| `npm run eslint` / `:fix`                   | `eslint src --ext .ts,.tsx`                                                                      |
| `npm run prettier-check` / `prettier-write` | Formatting                                                                                       |
| `npm run build`                             | Production build                                                                                 |
| `npm run update-i18n`                       | Regenerate `en.json` + re-sort `fr.json` from `defineMessages()` calls                           |
| `npm run deploy:rules`                      | Deploy prod Firestore/RTDB/Storage rules (`firebase.prod.json` → `firebase-config/*.prod.rules`) |

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

- **The backend is a standalone Go service** in the sibling repo `../back-pop`
  (`github.com/pop-quiz/back-pop`; its `CLAUDE.md` is the backend bible). The old in-repo
  `src/backend/**` (Server Actions → Service → Repository → firebase-admin) is **deleted** — the
  migration is complete (plan: `~/.claude/plans/back-pop-migrating-majestic-corbato.md`, gitignored,
  not in either repo). This repo keeps only: the Firebase **auth bridge**
  (`src/app/api/auth/firebase-token/route.ts` mints a custom token from the NextAuth session +
  `src/app/FirebaseAuthProvider.tsx` exchanges it via `signInWithCustomToken` so the client SDK holds
  an ID token), the **typed API client** (`src/api/` — `apiFetch` sends
  `Authorization: Bearer <idToken>`, plus one fn per Go endpoint in `endpoints.ts`; wire types in
  `types.ts` are hand-mirrored from `back-pop/api/openapi.yaml` — keep in sync), and the realtime
  Firebase-client `onSnapshot` listeners on `games/**`.
- **Layering:** the frontend (`src/app` + `src/{components,hooks,contexts,helpers}`) → `@/api` (`apiFetch` → `fetch`) → the Go service.
  In dev, `next.config.ts` `async rewrites()` proxies `/api/backend/*` → `BACKEND_ORIGIN` (Go on
  `:8090`); in prod set `NEXT_PUBLIC_BACKEND_URL` to hit the service directly (CORS). `src/models` is
  now **client-only** — domain enums + model classes + `*Factory` classes the Yup forms and question
  rendering need; it no longer has a server consumer.
- **Running locally:** `npm run dev` has **no backend** (API calls 502) and uses production Firebase
  for the `onSnapshot` listeners. To exercise the backend: emulators + `npm run seed`, then `make run`
  in `../back-pop` (`:8090`), `BACKEND_ORIGIN=http://127.0.0.1:8090` in `.env.development`, and
  `npm run dev:emulators`.
- **firebase-admin** survives only in `src/firebase/admin.ts` for two callers: the auth-bridge route
  (`adminAuth().createCustomToken`) and the NextAuth Firestore adapter (`adminFirestore`, in
  `src/app/api/auth/[...nextauth]/route.ts`). `adminDb()` / `adminStorageBucket()` are now unused.
  `next.config.ts` still externalizes `firebase-admin`/`@google-cloud/*`/`grpc` from the server bundle
  for those. Firestore rules: prod `games/**` stays read-open for the client's `onSnapshot`;
  `questions/**` and `users/**` are client-denied (the Go `GET /games/{g}/rounds/{r}/questions/{q}`,
  `…:editable`, and `GET /users` serve those). `firebase-config/firestore.rules` mirrors it for the emulator.
- **Firebase project config** lives in `firebase-config/` (`*.rules`, `*.prod.rules`, `firestore.indexes.json`).
  `firebase.json` (emulator), `firebase.prod.json` (prod deploy target for `deploy:rules`), and `.firebaserc`
  stay at repo root. `.firebaserc` aliases: `default` → `demo-pop` (emulator), `prod` → `qpc-app`.
- **Per-type polymorphism (client side):** `QuestionType` / `RoundType` enums + the client `*Factory`
  classes (`QuestionFactory`, `RoundFactory`, `NaguiOptionFactory`) switch on the enum to build model
  objects for rendering + the Yup submit forms. The backend has its own per-type dispatch in
  `back-pop`. Adding a type still touches many client files — `/add-question-type`.
- **Transactions / scoring / the `runTransaction` retry footgun now live in `back-pop`** (Go closure
  transactions + `internal/txhook` for deferred player-status fan-out). Nothing in this repo opens a
  transaction any more.
- **Frontend data:** TanStack Query over Firestore. `useFirestoreDocument`/`useFirestoreCollection` =
  one `useQuery` (`staleTime: Infinity`) + a shared `onSnapshot` pushed into the cache. Listeners are deduped
  per doc/query path (`acquireSharedSubscription`) to avoid double billing. (Migrated off react-firebase-hooks.)
- **Base questions (`questions/{id}`) are never read from the client** — the rule is `allow read: if false`.
  In-game: `usePlayableQuestion` → `getPlayableQuestion(g,r,q,type)` (`@/api`) → the Go
  `GET …/questions/{q}`, which strips answer fields for players/spectators and returns the full doc for
  organizers / once the question has ended, re-adding progressively-revealed pieces (clues, labelling,
  quote, enumeration, nagui) from live game state. `usePlayableQuestion` keys its cache on
  `gameStatus` + `isCurrentQuestion` + a per-type reveal signature. Editor: `useEditableQuestions` →
  `getEditableQuestions` → the organizer-gated Go `…:editable` (one batched request per round).
  **`matching` is not redacted yet** — its answer still ships in the playable response
  (see `.claude/plans/firestore-read-scoping.md`).
- **Game view state** comes via contexts, not props/refetch: `useGame`, `useRole`, `useTeamId`,
  `useUser`/`useUserId`, `useActiveQuestion`.
- **Action buttons:** wrap the `@/api` call in `useAsyncAction` — it has a ref-based
  re-entrancy guard for double/triple clicks (don't rely on `isLoading` alone).
- **Logging:** client code uses `console.*` directly (there are only a handful of sites). Structured
  logging (Pino-equivalent `slog`) lives in `back-pop`.
- **UI:** shadcn/ui (`base-nova` style, Base UI primitives) in `src/components/ui` — generated,
  don't hand-edit casually. `cn()` from `@/lib/utils`. Icons: `lucide-react`. Tailwind v4 (CSS-config,
  `src/app/globals.css`).
- **Forms:** react-hook-form + `@hookform/resolvers` + Yup; wired fields in
  `src/components/common/ReactHookFormComponents.tsx`. Older submit forms still use Formik — migration in progress.

## Core files

- `src/api/` — the backend seam. `client.ts` (`apiFetch`/`apiGet`/… + `ApiError`; awaits
  `auth.authStateReady()`, sends the Bearer ID token), `endpoints.ts` (one fn per Go operation),
  `types.ts` (wire types hand-mirrored from `back-pop/api/openapi.yaml` — **keep in sync**),
  `questionActions.ts` (`QUESTION_ACTIONS` name constants + `QuestionActionName`, mirroring the
  `action` enum / `back-pop/pkg/question/actions.go` — every name prefixed by its question type or
  family), `index.ts` barrel
- `src/app/api/auth/firebase-token/route.ts` + `src/app/FirebaseAuthProvider.tsx` — the auth bridge
- `src/models/**` — client-only domain models + `game-type.ts` / `question-type.ts` / `round-type.ts`
  enums + `QuestionFactory` / `RoundFactory` / `NaguiOptionFactory`
- `src/firebase/admin.ts` — firebase-admin (auth-bridge custom-token minting + NextAuth adapter only);
  `src/firebase/client.ts` — client SDK init (frontend only). Both keyed off `NEXT_PUBLIC_USE_EMULATORS`
- `src/helpers/forms/submitQuestionForm.ts` — builds the multipart body for `createQuestion` /
  `updateQuestion`
- `src/helpers/time.ts` — `isoToFirestoreTimestamp` (Go ISO `date-time` → the `{seconds}`
  shape the `time.ts` helpers expect)
- `src/hooks/firestore/**` — the Query + snapshot data layer (realtime `games/**` reads)
- `src/i18n/` — `defineMessages.ts`, `locale/{en,fr}.json`, `update-i18n.mjs`
- `next.config.ts` — React Compiler, `async rewrites()` (`/api/backend/*` → `BACKEND_ORIGIN`),
  `serverExternalPackages`
- `scripts/smoke-backend.mjs` — scripted front↔back API check (drives the `endpoints.ts` payloads
  against the emulators + `back-pop`); `/smoke-backend` runs it with the full stack bring-up
- `firebase-config/` — Firestore/RTDB/Storage rules + indexes; `firebase.json` / `firebase.prod.json` / `.firebaserc` at root
- `README.md` — full emulator setup + ports (Firebase Auth 9099, Firestore 8080, RTDB 9000, Storage 9199, UI 4000, `back-pop` 8090)

## Gotchas

- `dev:emulators` is flaky locally: crashes / leaves stray processes on the emulator ports (`preemulators`
  only frees 8080/9000). Use `/emulators` for a clean restart; don't rabbit-hole debugging it for one-off checks.
- `src/api/types.ts` + `src/api/questionActions.ts` are hand-mirrored from `back-pop/api/openapi.yaml`
  (`questionActions.ts` ⇔ the `QuestionActionRequest.action` enum / `back-pop/pkg/question/actions.go`) —
  `tsc` can't catch drift between them. After touching either side of the seam, run `/smoke-backend`
  (or `node scripts/smoke-backend.mjs`).
- No MCP servers are configured for this repo.
