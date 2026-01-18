'use server';

import GameOddOneOutQuestionService from '@/backend/services/question/odd-one-out/GameOddOneOutQuestionService';

export const resetQuestion = async (gameId, roundId, questionId) => {
  const service = new GameOddOneOutQuestionService(gameId, roundId);
  return service.resetQuestion(questionId);
};

export const endQuestion = async (gameId, roundId, questionId) => {
  const service = new GameOddOneOutQuestionService(gameId, roundId);
  return service.endQuestion(questionId);
};

export const handleCountdownEnd = async (gameId, roundId, questionId) => {
  const service = new GameOddOneOutQuestionService(gameId, roundId);
  return service.handleCountdownEnd(questionId);
};

/* =============================================================================================================== */

export const selectProposal = async (gameId, roundId, questionId, playerId, idx) => {
  const service = new GameOddOneOutQuestionService(gameId, roundId);
  return service.selectProposal(questionId, playerId, idx);
};
