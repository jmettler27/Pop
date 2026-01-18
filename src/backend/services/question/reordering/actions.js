'use server';

import GameReorderingQuestionService from '@/backend/services/question/reordering/GameReorderingQuestionService';

export const resetQuestion = async (gameId, roundId, questionId) => {
  const service = new GameReorderingQuestionService(gameId, roundId);
  return service.resetQuestion(questionId);
};

export const endQuestion = async (gameId, roundId, questionId) => {
  const service = new GameReorderingQuestionService(gameId, roundId);
  return service.endQuestion(questionId);
};

export const handleCountdownEnd = async (gameId, roundId, questionId) => {
  const service = new GameReorderingQuestionService(gameId, roundId);
  return service.handleCountdownEnd(questionId);
};

/* =============================================================================================================== */

export const submitOrdering = async (gameId, roundId, questionId, playerId, teamId, ordering) => {
  const service = new GameReorderingQuestionService(gameId, roundId);
  return service.submitOrdering(questionId, playerId, teamId, ordering);
};
