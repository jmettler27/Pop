'use server';

import GameEnumerationQuestionService from '@/backend/services/question/enumeration/GameEnumerationQuestionService';

export const resetQuestion = async (gameId, roundId, questionId) => {
  const service = new GameEnumerationQuestionService(gameId, roundId);
  return service.resetQuestion(questionId);
};

export const endQuestion = async (gameId, roundId, questionId) => {
  const service = new GameEnumerationQuestionService(gameId, roundId);
  return service.endQuestion(questionId);
};

export const handleCountdownEnd = async (gameId, roundId, questionId) => {
  const service = new GameEnumerationQuestionService(gameId, roundId);
  return service.handleCountdownEnd(questionId);
};

/* ============================================================================================================ */

export const addBet = async (gameId, roundId, questionId, playerId, teamId, bet) => {
  const service = new GameEnumerationQuestionService(gameId, roundId);
  return service.addBet(questionId, playerId, teamId, bet);
};

export const endReflection = async (gameId, roundId, questionId) => {
  const service = new GameEnumerationQuestionService(gameId, roundId);
  return service.endReflection(questionId);
};

export const validateItem = async (gameId, roundId, questionId, itemIdx) => {
  const service = new GameEnumerationQuestionService(gameId, roundId);
  return service.validateItem(questionId, itemIdx);
};

export const incrementValidItems = async (gameId, roundId, questionId, organizerId) => {
  const service = new GameEnumerationQuestionService(gameId, roundId);
  return service.incrementValidItems(questionId, organizerId);
};
