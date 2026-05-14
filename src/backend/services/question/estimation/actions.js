'use server';

import GameEstimationQuestionService from '@/backend/services/question/estimation/GameEstimationQuestionService';

export const resetQuestion = async (gameId, roundId, questionId) => {
  const service = new GameEstimationQuestionService(gameId, roundId);
  return service.resetQuestion(questionId);
};

export const endQuestion = async (gameId, roundId, questionId) => {
  const service = new GameEstimationQuestionService(gameId, roundId);
  return service.endQuestion(questionId);
};

export const handleCountdownEnd = async (gameId, roundId, questionId) => {
  const service = new GameEstimationQuestionService(gameId, roundId);
  return service.handleCountdownEnd(questionId);
};

/* =============================================================================================================== */

export const submitBet = async (gameId, roundId, questionId, playerId, teamId, bet) => {
  const service = new GameEstimationQuestionService(gameId, roundId);
  return service.submitBet(questionId, playerId, teamId, bet);
};
