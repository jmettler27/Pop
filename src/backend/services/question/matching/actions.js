'use server';

import GameMatchingQuestionService from '@/backend/services/question/matching/GameMatchingQuestionService';

export const resetQuestion = async (gameId, roundId, questionId) => {
  const service = new GameMatchingQuestionService(gameId, roundId);
  return service.resetQuestion(questionId);
};

export const endQuestion = async (gameId, roundId, questionId) => {
  const service = new GameMatchingQuestionService(gameId, roundId);
  return service.endQuestion(questionId);
};

export const handleCountdownEnd = async (gameId, roundId, questionId) => {
  const service = new GameMatchingQuestionService(gameId, roundId);
  return service.handleCountdownEnd(questionId);
};

/* ============================================================================================================ */

export const submitMatch = async (gameId, roundId, questionId, userId, edges, match) => {
  const service = new GameMatchingQuestionService(gameId, roundId);
  return service.submitMatch(questionId, userId, edges, match);
};
