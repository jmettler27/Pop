'use server';

import GameProgressiveCluesQuestionService from '@/backend/services/question/progressive-clues/GameProgressiveCluesQuestionService';

export const revealClue = async (gameId: string, roundId: string, questionId: string) => {
  const service = new GameProgressiveCluesQuestionService(gameId, roundId);
  return service.revealClue(questionId);
};
