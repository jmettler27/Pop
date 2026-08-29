'use server';

import GameReorderingQuestionService from '@/backend/services/question/reordering/GameReorderingQuestionService';

export const submitOrdering = async (
  gameId: string,
  roundId: string,
  questionId: string,
  playerId: string,
  teamId: string,
  orderedTitles: string[]
) => {
  const service = new GameReorderingQuestionService(gameId, roundId);
  return service.submitOrdering(questionId, playerId, teamId, orderedTitles);
};
