![logo](./cover.png)

# Pop!

**Pop!** is a real-time, interactive quiz game web app built with [Next.js](https://nextjs.org/) and [Firebase](https://firebase.google.com), hosted on [Vercel](https://vercel.com/).

Create, organize, play, and spectate quiz games with friends — covering **video games**, **movies**, **anime/manga**, **music**, **literature**, **Internet culture**, and more.

> **Note:** The game is designed to be played while chatting in-person or on a VoIP app such as Discord or Zoom.

## Features

- **Real-time multiplayer** — play with friends in teams or solo
- **12 unique round types** — Progressive Clues, Image, Emoji, Blindtest, Quote, Labelling, Enumeration, Odd One Out, Matching, Reordering, MCQ, and Nagui
- **Role-based gameplay** — organizers control the game, players answer, spectators watch
- **Buzzer system** — race to answer first in buzzer-based rounds
- **Scoring & leaderboards** — round scores, global scores, and dynamic charts
- **Sound effects & soundboard** — immersive audio feedback
- **Question database** — submit, review, and reuse community questions
- **OAuth2 authentication** — sign in with Google or Discord
- **Internationalization** — English and French

## Documentation

For detailed gameplay rules, round type descriptions, scoring mechanics, and more, visit the **[Wiki](https://github.com/jmettler27/Pop/wiki/)**.

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [Next.js](https://nextjs.org/) |
| **UI** | [React](https://reactjs.org/), [Material UI](https://material-ui.com/), [Tailwind CSS](https://tailwindcss.com/) |
| **Auth** | [NextAuth.js](https://next-auth.js.org/) (Google, Discord) |
| **Database** | [Firestore](https://firebase.google.com/docs/firestore) |
| **Storage** | [Firebase Storage](https://firebase.google.com/docs/storage) |
| **Hosting** | [Vercel](https://vercel.com/) |
| **Forms** | [Formik](https://formik.org/), [Yup](https://github.com/jquense/yup) |

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- A [Firebase](https://firebase.google.com/) project (Firestore + Storage)
- OAuth credentials for [Google](https://console.cloud.google.com/) and/or [Discord](https://discord.com/developers/applications)

### Installation

```bash
# Clone the repository
git clone https://github.com/jmettler27/Pop.git
cd Pop

# Install dependencies
npm install

# Set up environment variables
# Copy process.env and fill in your Firebase + OAuth credentials

# Start the development server
npm run dev
```

The app will be available at `http://localhost:3000`.

### Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the development server (uses production Firebase) |
| `npm run dev:emulators` | Start emulators + dev server together (local data) |
| `npm run emulators` | Start Firebase Emulator Suite only |
| `npm run seed` | Seed the running emulators with sample data |
| `npm run build` | Build for production |
| `npm run start` | Start the production server |
| `npm run lint` | Run ESLint |

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
```

- **App**: http://localhost:3000
- **Emulator UI**: http://localhost:4000 (browse Firestore data, Storage files, etc.)

### How It Works

- `.env.development` sets `NEXT_PUBLIC_USE_EMULATORS=true` and uses a demo project (`demo-pop`)
- When this flag is set, the app connects to local emulators instead of production Firebase
- Running `npm run dev` without `.env.development` still connects to your real Firebase project (backwards compatible)
- Emulator data is persisted in `emulator-data/` (git-ignored) via `--export-on-exit`

### Emulator Ports

| Service | Port |
|---|---|
| Firestore | 8080 |
| Realtime Database | 9000 |
| Storage | 9199 |
| Emulator UI | 4000 |

## Project Structure

```
src/
├── app/                # Next.js App Router pages & layouts
│   ├── (game)/         # Game pages
│   ├── api/            # API routes (NextAuth)
│   ├── edit/           # Game editor
│   ├── join/           # Join game flow
│   └── submit/         # Question submission forms
├── backend/            # Server-side logic
│   ├── firebase/       # Firebase configuration
│   ├── models/         # Data models
│   ├── repositories/   # Data access layer
│   └── services/       # Business logic
├── frontend/           # Client-side components & utilities
│   ├── components/     # React components
│   ├── hooks/          # Custom React hooks
│   └── helpers/        # Client utilities
└── i18n/               # Internationalization (EN/FR)
```
