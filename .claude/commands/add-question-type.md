---
description: Checklist + scaffolding for adding a new quiz question type across every layer
argument-hint: <name> (e.g. crossword)
---

Adding a question type is cross-cutting. First pick the closest existing type as a template
(`matching` for interactive/grid, `mcq`/`nagui` for choice-based, `basic`/`buzzer` for buzzer rounds,
`estimation` for numeric) and read it end to end. Then, for type **`$1`**:

**Models — `src/models/`**

- `questions/question-type.ts` — add the `QuestionType` enum member
- `questions/<type>.ts` — `XQuestion` (submitted) + `GameXQuestion` (in-game) classes.
  **`XQuestion.toPlayableObject()`** — override it to strip the answer fields (`answerIdx`, `answer`,
  `labels`, `toGuess`, correct order, …); the base returns the full `toObject()`, so *without an override the
  answer leaks to players* via `getPlayableQuestion`. If the answer is revealed piecemeal during play
  (driven by the game-question / realtime doc), the field-omission lives here and `PlayableQuestionService`
  re-adds the revealed slice + `usePlayableQuestion` gets a per-type `revealKey` — copy the closest of
  progressive-clues / labelling / quote / enumeration / nagui.
- `questions/QuestionFactory.ts` — both switch statements
- `rounds/<type>.ts`, `rounds/round-type.ts`, `rounds/RoundFactory.ts` — only if it needs its own round type

**Backend — `src/backend/`**

- `repositories/question/BaseX...Repository.ts` + `GameX...Repository.ts`, then
  `BaseQuestionRepositoryFactory.ts` + `GameQuestionRepositoryFactory.ts`
- `services/question/<type>/GameXQuestionService.ts` — extends `GameQuestionService`. Pair every
  `fooTransaction(transaction, …)` with a `foo(…)` wrapper that opens the tx via `this.pendingStatus.runTransaction(fn)`
  (inherited). **Never** call a non-`*Transaction` repo write inside a transaction callback — under
  firebase-admin + the emulator it deadlocks. Whole-team `status` changes go through
  `this.pendingStatus.enqueueTeam*(…)`, not `playerRepo.updateTeamPlayersStatus` (see CLAUDE.md →
  `runTransaction` footgun).
- `services/question/<type>/actions.ts` — `'use server'`, thin `new Service(...).method(...)` wrappers
- `services/round/XRoundService.ts` + `RoundServiceFactory.ts`; `services/question/GameQuestionServiceFactory.ts`

**Frontend — `src/frontend/`**

- `app/submit/<type>/page.tsx` + `components/question-forms/SubmitXQuestionForm.tsx` (react-hook-form + Yup)
- `components/game/main-pane/question/<type>/` — middle/bottom panes + per-role controllers
- `components/game/mobile/MobileXControl.tsx`
- `helpers/question-types.tsx`, `helpers/forms/questions.ts`
- `hooks/firestore/question/` — only if it needs bespoke subscriptions

**i18n:** every user-facing string via `defineMessages`, then `/i18n`.

Produce the concrete file list for `$1` (template chosen, each path marked new/edit) and confirm with me
before scaffolding.
