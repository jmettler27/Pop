import { Timestamp } from 'firebase-admin/firestore';

import GameRepository from '@/backend/repositories/game/GameRepository';
import BaseQuestionRepository from '@/backend/repositories/question/BaseQuestionRepository';
import GameQuestionRepository from '@/backend/repositories/question/GameQuestionRepository';
import OrganizerRepository from '@/backend/repositories/user/OrganizerRepository';
import { GameStatus } from '@/models/games/game-status';
import { QuestionType } from '@/models/questions/question-type';

function serializeTimestamps(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    out[key] = value instanceof Timestamp ? { seconds: value.seconds, nanoseconds: value.nanoseconds } : value;
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

    const [game, organizer, gameQuestion] = await Promise.all([
      new GameRepository().get(gameId),
      viewerId ? new OrganizerRepository(gameId).getOrganizer(viewerId) : Promise.resolve(null),
      new GameQuestionRepository(gameId, roundId, questionType).getQuestion(questionId).catch(() => null),
    ]);

    const isOrganizer = organizer != null;
    const questionHasEnded = (gameQuestion as { dateEnd?: unknown } | null)?.dateEnd != null;
    const gameShowingAnswer =
      (game as { status?: string } | null)?.status === GameStatus.QUESTION_END &&
      (game as { currentQuestion?: string } | null)?.currentQuestion === questionId;

    const reveal = isOrganizer || questionHasEnded || gameShowingAnswer;
    const payload = reveal ? base.toObject() : base.toPlayableObject();

    if (!reveal && base.type === QuestionType.PROGRESSIVE_CLUES) {
      revealCluesSoFar(payload, base as { clues?: string[] }, gameQuestion as { currentClueIdx?: number } | null);
    }

    return { id: questionId, ...serializeTimestamps(payload) };
  }
}
