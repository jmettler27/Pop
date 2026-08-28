---
description: Run the checks CI runs (typecheck, ESLint, Prettier) and fix what's broken
allowed-tools: Bash(npm run:*), Bash(npx tsc:*), Bash(npx eslint:*), Bash(npx prettier:*), Read, Edit, Grep, Glob
---

Mirror the CI pipeline (`.github/workflows/ci.yml`) locally before I push. Run, in order:

1. `npm run typecheck` — `tsc --noEmit`, strict.
2. `npm run eslint` — `eslint src --ext .ts,.tsx`. `unused-imports/no-unused-imports` is an error;
   `@typescript-eslint/no-explicit-any` is a warning (don't introduce new ones).
3. `npm run prettier-check` — if it fails, run `npm run prettier-write`, then re-check.

CI also runs `npm run build` (Node 24). Run it too **only** if the change could plausibly affect the build
(`next.config.ts`, server/client boundaries, new deps, `'use server'` / `'use client'` edges); otherwise skip
it for speed and say so.

Then:

- Fix failures you introduced, and trivial ones (formatting, unused imports, obvious type slips).
- For pre-existing failures unrelated to my change, list them and ask before touching.
- End with a one-line pass/fail per check.
