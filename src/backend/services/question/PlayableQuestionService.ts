import { Timestamp } from 'firebase-admin/firestore';

import GameRepository from '@/backend/repositories/game/GameRepository';
import BaseQuestionRepository from '@/backend/repositories/question/BaseQuestionRepository';
import GameQuestionRepository from '@/backend/repositories/question/GameQuestionRepository';
import OrganizerRepository from '@/backend/repositories/user/OrganizerRepository';
import { GameStatus } from '@/models/games/game-status';
import { type QuestionType } from '@/models/questions/question-type';

function serializeTimestamps(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    out[key] = value instanceof Timestamp ? { seconds: value.seconds, nanoseconds: value.nanoseconds } : value;
  }
  return out;
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

    return { id: questionId, ...serializeTimestamps(payload) };
  }
}
