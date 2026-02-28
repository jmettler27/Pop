'use server';

import QuoteRoundService from '@/backend/services/round/quote/QuoteRoundService';

export const handleRoundSelected = async (gameId, roundId, userId) => {
  const service = new QuoteRoundService(gameId);
  return service.handleRoundSelected(userId);
};

export const startRound = async (gameId, roundId) => {
  const service = new QuoteRoundService(gameId);
  return service.startRound(roundId);
};

export const handleQuestionEnd = async (gameId, roundId, questionId) => {
  const service = new QuoteRoundService(gameId);
  return service.handleQuestionEnd(roundId, questionId);
};

export const endRound = async (gameId, roundId) => {
  const service = new QuoteRoundService(gameId);
  return service.endRound();
};

/* =============================================================================================================== */
