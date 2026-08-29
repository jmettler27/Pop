import GameRepository from '@/backend/repositories/game/GameRepository';
import BaseQuestionRepository from '@/backend/repositories/question/BaseQuestionRepository';
import GameEnumerationQuestionRepository from '@/backend/repositories/question/GameEnumerationQuestionRepository';
import GameQuestionRepository from '@/backend/repositories/question/GameQuestionRepository';
import OrganizerRepository from '@/backend/repositories/user/OrganizerRepository';
import { GameStatus } from '@/models/games/game-status';
import { DuoNaguiOption } from '@/models/questions/nagui';
import { QuestionType } from '@/models/questions/question-type';
import { redactQuoteDetails, type QuoteDetails } from '@/models/questions/quote';

// The only base-question fields an in-game client needs — identity plus what it renders.
// `approved` / `createdAt` / `createdBy` are DB bookkeeping (and `createdAt` is the only
// Firestore Timestamp in the object, so dropping it also removes the serialization concern).
const PUBLIC_FIELDS = ['type', 'topic', 'lang', 'details'] as const;

function publicQuestion(id: string, obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = { id };
  for (const key of PUBLIC_FIELDS) {
    if (key in obj) out[key] = obj[key];
  }
  return out;
}

/**
 * Progressive-clues hides every clue text from `toPlayableObject()`; put back only the
 * ones the organizer has revealed so far. `currentClueIdx` is -1 before the first clue
 * and advances by one per reveal, so clues `0..currentClueIdx` are visible. Mirrors the
 * client's old `clues.slice` against the live `currentClueIdx`.
 */
function revealCluesSoFar(
  payload: Record<string, unknown>,
  base: { clues?: string[] },
  gameQuestion: { currentClueIdx?: number } | null
): void {
  const allClues = base.clues ?? [];
  const rawIdx = gameQuestion?.currentClueIdx;
  const idx = typeof rawIdx === 'number' ? rawIdx : 0;
  const details = (payload.details ?? {}) as Record<string, unknown>;
  details.clues = idx >= 0 ? allClues.slice(0, idx + 1) : [];
  payload.details = details;
}

/**
 * Labelling hides every label text from `toPlayableObject()`; put back a same-length
 * array with only the labels the organizer/players have revealed so far filled in — the
 * rest stay `''`. Length is preserved because the client renders a numbered list from it
 * (and the round sidebar reads `labels.length` for the point value). A non-empty
 * `revealed[i]` entry means label `i` is shown, matching `GameLabellingQuestion.labelIsRevealed`.
 */
function revealLabelsSoFar(
  payload: Record<string, unknown>,
  base: { labels?: string[] },
  gameQuestion: { revealed?: Record<string, unknown>[] } | null
): void {
  const allLabels = base.labels ?? [];
  const revealed = gameQuestion?.revealed ?? [];
  const isRevealed = (i: number) => {
    const entry = revealed[i];
    return !!entry && Object.keys(entry).length > 0;
  };
  const details = (payload.details ?? {}) as Record<string, unknown>;
  details.labels = allLabels.map((text, i) => (isRevealed(i) ? text : ''));
  payload.details = details;
}

/**
 * Quote hides its `toGuess` elements in `toPlayableObject()`; recompute that mask against
 * the live `revealed` map so uncovered elements / quote parts come back in the clear. A
 * non-empty `revealed[element]` (or `revealed.quote[sortedPartIdx]`) means it's shown,
 * matching `DisplayedQuoteElement` / `DisplayedQuote`.
 */
function revealQuoteElementsSoFar(
  payload: Record<string, unknown>,
  base: QuoteDetails,
  gameQuestion: { revealed?: Record<string, Record<string, unknown>> } | null
): void {
  const revealed = gameQuestion?.revealed ?? {};
  const nonEmpty = (v: unknown) => !!v && typeof v === 'object' && Object.keys(v as object).length > 0;
  const isRevealed = (element: string) => nonEmpty(revealed[element]);
  const isQuotePartRevealed = (sortedIdx: number) => nonEmpty((revealed['quote'] ?? {})[sortedIdx]);
  payload.details = redactQuoteDetails(
    {
      author: base.author,
      quote: base.quote,
      quoteParts: base.quoteParts,
      source: base.source,
      toGuess: base.toGuess,
    },
    isRevealed,
    isQuotePartRevealed
  );
}

/**
 * Enumeration keeps a blanked, same-length `answer` list in `toPlayableObject()` (the
 * count is public); fill in the entries the organizer has credited to the challenger.
 * `challenger.cited` is an index→timestamp map on the `realtime/players` doc, matching the
 * client's `challenger?.cited?.[index] !== undefined` check.
 */
function revealEnumerationAnswersSoFar(
  payload: Record<string, unknown>,
  base: { answer?: string[] },
  cited: Record<string, unknown> | null | undefined
): void {
  const allAnswers = base.answer ?? [];
  const citedMap = cited ?? {};
  const details = (payload.details ?? {}) as Record<string, unknown>;
  details.answer = allAnswers.map((text, i) => (citedMap[i] !== undefined ? text : ''));
  payload.details = details;
}

/**
 * Nagui's "duo" lifeline shows the chooser two choices — the answer and one decoy
 * (`duoIdx`). Those indices are hidden from `toPlayableObject()`, so once the chooser has
 * picked duo, hand back the pair (sorted, so position gives nothing away) for the client
 * to filter on. No-op for the other lifelines / before one is picked.
 */
function revealNaguiDuoPair(
  payload: Record<string, unknown>,
  base: { answerIdx?: number; duoIdx?: number },
  gameQuestion: { option?: string | null } | null
): void {
  if (gameQuestion?.option !== DuoNaguiOption.TYPE) return;
  const { answerIdx, duoIdx } = base;
  if (typeof answerIdx !== 'number' || typeof duoIdx !== 'number') return;
  const details = (payload.details ?? {}) as Record<string, unknown>;
  details.duoIndices = [answerIdx, duoIdx].sort((a, b) => a - b);
  payload.details = details;
}

/**
 * Serves the base question (`questions/{id}`) to in-game clients, redacting the
 * answer-bearing fields while the question is still live for players and
 * spectators. Organizers always get the full question (they run the game); so does
 * anyone once the question has ended. This is why the client no longer reads
 * `questions/{id}` directly for gameplay — production rules only allow the editor's
 * `get`, and eventually not even that.
 */
export default class PlayableQuestionService {
  static async get(
    gameId: string,
    roundId: string,
    questionType: QuestionType,
    questionId: string,
    viewerId: string | undefined
  ): Promise<Record<string, unknown> | null> {
    const base = await new BaseQuestionRepository(questionType).getQuestion(questionId);
    if (!base) return null;

    const [game, organizer, gameQuestion, enumPlayers] = await Promise.all([
      new GameRepository().get(gameId),
      viewerId ? new OrganizerRepository(gameId).getOrganizer(viewerId) : Promise.resolve(null),
      new GameQuestionRepository(gameId, roundId, questionType).getQuestion(questionId).catch(() => null),
      questionType === QuestionType.ENUMERATION
        ? new GameEnumerationQuestionRepository(gameId, roundId).getPlayers(questionId).catch(() => null)
        : Promise.resolve(null),
    ]);

    const isOrganizer = organizer != null;
    const questionHasEnded = (gameQuestion as { dateEnd?: unknown } | null)?.dateEnd != null;
    const isCurrentQuestion = (game as { currentQuestion?: string } | null)?.currentQuestion === questionId;
    const gameShowingAnswer =
      (game as { status?: string } | null)?.status === GameStatus.QUESTION_END && isCurrentQuestion;

    const reveal = isOrganizer || questionHasEnded || gameShowingAnswer;

    // A question that hasn't run yet: the round sidebar only shows its topic. Withhold the
    // whole prompt (title / image / note / choices / …), not just the answer — otherwise a
    // player can read every upcoming question from the network tab before it starts.
    const started = isCurrentQuestion || (gameQuestion as { dateStart?: unknown } | null)?.dateStart != null;
    if (!reveal && !started) {
      const full = base.toObject();
      return { id: questionId, type: full.type, topic: full.topic, lang: full.lang };
    }

    const payload = reveal ? base.toObject() : base.toPlayableObject();

    if (!reveal && base.type === QuestionType.PROGRESSIVE_CLUES) {
      revealCluesSoFar(payload, base as { clues?: string[] }, gameQuestion as { currentClueIdx?: number } | null);
    }
    if (!reveal && base.type === QuestionType.LABELLING) {
      revealLabelsSoFar(
        payload,
        base as { labels?: string[] },
        gameQuestion as { revealed?: Record<string, unknown>[] } | null
      );
    }
    if (!reveal && base.type === QuestionType.QUOTE) {
      revealQuoteElementsSoFar(
        payload,
        base as QuoteDetails,
        gameQuestion as { revealed?: Record<string, Record<string, unknown>> } | null
      );
    }
    if (!reveal && base.type === QuestionType.ENUMERATION) {
      const cited = (enumPlayers as { challenger?: { cited?: Record<string, unknown> } } | null)?.challenger?.cited;
      revealEnumerationAnswersSoFar(payload, base as { answer?: string[] }, cited);
    }
    // Not gated on `!reveal`: the client filters the duo pair off `duoIndices` for everyone.
    if (base.type === QuestionType.NAGUI) {
      revealNaguiDuoPair(
        payload,
        base as { answerIdx?: number; duoIdx?: number },
        gameQuestion as { option?: string | null } | null
      );
    }

    return publicQuestion(questionId, payload);
  }
}
