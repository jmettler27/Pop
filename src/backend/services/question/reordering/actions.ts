'use server';

import GameReorderingQuestionService from '@/backend/services/question/reordering/GameReorderingQuestionService';
import { SubmittedOrdering } from '@/models/questions/reordering';

export const submitOrdering = async (
  gameId: string,
  roundId: string,
  questionId: string,
  playerId: string,
  teamId: string,
  ordering: SubmittedOrdering
) => {
  const service = new GameReorderingQuestionService(gameId, roundId);
  return service.submitOrdering(questionId, playerId, teamId, ordering);
};
