'use server';

import GameQuoteQuestionService from '@/backend/services/question/quote/GameQuoteQuestionService';

export const resetQuestion = async (gameId, roundId, questionId) => {
  const service = new GameQuoteQuestionService(gameId, roundId);
  return service.resetQuestion(questionId);
};

export const endQuestion = async (gameId, roundId, questionId) => {
  const service = new GameQuoteQuestionService(gameId, roundId);
  return service.endQuestion(questionId);
};

export const handleCountdownEnd = async (gameId, roundId, questionId) => {
  const service = new GameQuoteQuestionService(gameId, roundId);
  return service.handleCountdownEnd(questionId);
};

/* =============================================================================================================== */

export const handleBuzzerHeadChanged = async (gameId, roundId, questionId, playerId) => {
  const service = new GameQuoteQuestionService(gameId, roundId);
  return service.handleBuzzerHeadChanged(questionId, playerId);
};

export const clearBuzzer = async (gameId, roundId, questionId) => {
  const service = new GameQuoteQuestionService(gameId, roundId);
  return service.clearBuzzer(questionId);
};

export const revealQuoteElement = async (
  gameId,
  roundId,
  questionId,
  quoteElem,
  quotePartIdx = null,
) => {
  const service = new GameQuoteQuestionService(gameId, roundId);
  return service.revealQuoteElement(questionId, quoteElem, quotePartIdx);
};

export const validateAllQuoteElements = async (gameId, roundId, questionId, playerId) => {
  const service = new GameQuoteQuestionService(gameId, roundId);
  return service.validateAllQuoteElements(questionId, playerId);
};

export const cancelPlayer = async (gameId, roundId, questionId, playerId) => {
  const service = new GameQuoteQuestionService(gameId, roundId);
  return service.cancelPlayer(questionId, playerId);
};
