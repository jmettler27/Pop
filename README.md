![logo](./cover.png)

# Pop!

**Pop!** is a real-time, interactive quiz game web app built with [Next.js](https://nextjs.org/) and [Firebase](https://firebase.google.com). Gameplay, scoring, and the question bank are served by a standalone Go backend, [`back-pop`](https://github.com/jmettler27/back-pop) (developed in a sibling repo).

Create, organize, play, and spectate quiz games with friends — covering **video games**, **movies**, **anime/manga**, **music**, **literature**, **Internet culture**, and more.

> **Note:** The game is designed to be played while chatting in-person or on a VoIP app such as Discord or Zoom.

## Features

- **Real-time multiplayer** — play with friends in teams or solo
- **14 unique question types**
- **Role-based gameplay** — organizers control the game, players answer, spectators watch
- **Scoring & leaderboards** — round scores, global scores, and dynamic charts
- **Question database** — submit, review, and reuse community questions
- **OAuth2 authentication** — sign in with Google or Discord

## Documentation

For detailed gameplay rules, round type descriptions, scoring mechanics, and more, visit the **[Wiki](https://github.com/jmettler27/Pop/wiki/)**.

## Tech Stack

| Layer        | Technology                                                                                                                                                         |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Frontend** | [Next.js](https://nextjs.org/), [React](https://reactjs.org/), [shadcn/ui](https://ui.shadcn.com/), [Tailwind CSS](https://tailwindcss.com/)                       |
| **Backend**  | [`back-pop`](https://github.com/jmettler27/back-pop) — a standalone Go REST service (writes, one-shot reads, the question bank)                                    |
| **Auth**     | [NextAuth.js](https://next-auth.js.org/) (Google, Discord) + a Firebase custom-token bridge so the browser can call `back-pop`                                     |
| **Database** | [Firestore](https://firebase.google.com/docs/firestore) — the browser keeps realtime `onSnapshot` listeners on `games/**`; everything else goes through `back-pop` |
| **Storage**  | [Firebase Storage](https://firebase.google.com/docs/storage) — question image/audio uploads go through `back-pop`                                                  |
| **Forms**    | [React Hook Form](https://react-hook-form.com/) + [Yup](https://github.com/jquense/yup) (legacy forms: [Formik](https://formik.org/))                              |

## Backend

This repo is **frontend-only**. Every write, every one-shot read, and the whole question bank are
served by [`back-pop`](https://github.com/jmettler27/back-pop), a Go REST service developed in a
sibling repo (clone it next to this one as `../back-pop`).

- **`src/api/`** is the seam: `client.ts` (`apiFetch` — attaches a Firebase ID token as
  `Authorization: Bearer`), `endpoints.ts` (one function per Go operation), `types.ts` (wire types
  **hand-mirrored** from `back-pop/api/openapi.yaml` — keep them in sync).
- **Auth bridge:** `src/app/api/auth/firebase-token/route.ts` mints a Firebase custom token from the
  NextAuth session; `src/app/FirebaseAuthProvider.tsx` exchanges it (`signInWithCustomToken`) so the
  browser holds an ID token `back-pop` can verify.
- **`firebase-admin`** (`src/firebase/admin.ts`) survives only for that route and the NextAuth
  Firestore adapter.
- **In dev**, `next.config.ts` `rewrites` proxy `/api/backend/*` → `BACKEND_ORIGIN`. Set
  `BACKEND_ORIGIN=http://127.0.0.1:8090` in `.env.development` and run `make run` in `../back-pop`.
- **Smoke test:** `node scripts/smoke-backend.mjs` drives the exact payloads `endpoints.ts` sends
  against the emulators + `back-pop` and reports pass/fail — run it after touching either side of
  the seam. See [`.claude/commands/smoke-backend.md`](.claude/commands/smoke-backend.md) for the
  full setup.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v20+ — CI runs Node 24)
- [JDK](https://www.oracle.com/java/technologies/downloads/) (v11+, for the Firebase emulators)
- [Go](https://go.dev/) (1.27+) and a clone of [`back-pop`](https://github.com/jmettler27/back-pop)
  at `../back-pop` — only needed to run the backend locally

### Available Scripts

| Command                          | Description                                                                                  |
| -------------------------------- | -------------------------------------------------------------------------------------------- |
| `npm run dev`                    | Dev server against **production** Firebase for `onSnapshot`; **no backend** (API calls fail) |
| `npm run dev:emulators`          | Emulators + dev server together (local data). Run `back-pop` too to exercise the API         |
| `npm run emulators`              | Firebase Emulator Suite only                                                                 |
| `npm run seed`                   | Seed the running emulators with sample data                                                  |
| `npm run build`                  | Build for production                                                                         |
| `npm run start`                  | Start the production server                                                                  |
| `npm run typecheck`              | Type-check (`tsc --noEmit`)                                                                  |
| `npm run eslint`                 | Lint `src` (`eslint:fix` to autofix)                                                         |
| `npm run prettier-check`         | Check formatting (`prettier-write` to fix)                                                   |
| `npm run update-i18n`            | Regenerate the i18n catalogs from `defineMessages()`                                         |
| `npm run deploy:rules`           | Deploy production Firestore / RTDB / Storage rules (`firebase-config/*.prod.rules`)          |
| `node scripts/smoke-backend.mjs` | Scripted front↔back API smoke test (see [Backend](#backend))                                 |

CI (`.github/workflows/ci.yml`) gates PRs to `main` on **build + prettier-check + eslint + typecheck**.

## Local Development with Emulators

You can develop entirely offline using the **Firebase Emulator Suite**, which emulates Firestore, Realtime Database, and Storage locally.

### Quick Start

```bash
# Install dependencies
npm install

# Start the emulators + Next.js dev server
npm run dev:emulators

# In another terminal, seed the emulators with sample data (first time only)
npm run seed

# To exercise the backend, also run the Go service (see ../back-pop):
#   cd ../back-pop && make run          # listens on :8090
# and set BACKEND_ORIGIN=http://127.0.0.1:8090 in .env.development
```

- **App**: http://localhost:3000
- **Emulator UI**: http://localhost:4000 (browse Firestore data, Storage files, etc.)
- **`back-pop`**: http://localhost:8090 (only if you started it)

### How It Works

- `.env.development` sets `NEXT_PUBLIC_USE_EMULATORS=true` and uses a demo project (`demo-pop`)
- When this flag is set, the app connects to local emulators instead of production Firebase
- Running `npm run dev` without `.env.development` connects to your real Firebase project
- The browser uses the Firebase **client** SDK only for realtime `onSnapshot` listeners on `games/**`;
  everything else goes through `back-pop` (see [Backend](#backend)). `npm run dev:emulators` on its
  own has **no backend** — API calls 502 until you run `make run` in `../back-pop`
- The emulator runs as project `demo-pop` (pinned via `--project` in the `emulators` script)
- Emulator data is persisted in `emulator-data/` (git-ignored) via `--export-on-exit`

### Ports

| Service           | Port |
| ----------------- | ---- |
| Firebase Auth     | 9099 |
| Firestore         | 8080 |
| Realtime Database | 9000 |
| Storage           | 9199 |
| Emulator UI       | 4000 |
| `back-pop` (Go)   | 8090 |

## Project Structure

```
firebase-config/            # Firestore / RTDB / Storage security rules + indexes (deploy config)
firebase.json               # Emulator config
firebase.prod.json          # Production rules deploy target (npm run deploy:rules)
scripts/                    # One-off scripts (emulator seeding, backend smoke test)
src/
├── api/                    # The back-pop seam: apiFetch client + one fn per Go endpoint + wire types
├── app/                    # Next.js App Router pages & layouts
│   ├── (game)/             # Game page
│   ├── about/              # About page
│   ├── api/auth/           # NextAuth route + the Firebase custom-token bridge
│   ├── auth/               # Sign-in page
│   ├── edit/               # Game editor
│   ├── join/               # Join game flow
│   └── submit/             # Question submission forms (one per question type)
├── components/             # React components (ui/ = shadcn/ui primitives)
├── contexts/               # React contexts
├── firebase/               # Firebase SDK init: client.ts (browser SDK) + admin.ts (auth bridge / NextAuth adapter) + barrels
├── helpers/                # Utility functions (arrays, time, sounds, forms, …)
├── hooks/                  # React hooks (hooks/firestore/ = Query + onSnapshot data layer)
├── i18n/                   # Internationalization (English / French)
├── lib/                    # Shared client utilities (e.g. cn helper)
├── models/                 # Client-only domain models + per-type enums & factories
└── types/                  # Ambient/global TypeScript declarations (e.g. NextAuth module augmentation)
```

> Gameplay / scoring / the question bank live in [`back-pop`](https://github.com/jmettler27/back-pop),
> not here.
