'use server';

import MixedRoundService from '@/backend/services/round/mixed/MixedRoundService';

export const handleRoundSelected = async (gameId, roundId, userId) => {
  const service = new MixedRoundService(gameId);
  return service.handleRoundSelected(userId);
};

export const startRound = async (gameId, roundId) => {
  const service = new MixedRoundService(gameId);
  return service.startRound(roundId);
};

export const handleQuestionEnd = async (gameId, roundId, questionId) => {
  const service = new MixedRoundService(gameId);
  return service.handleQuestionEnd(roundId, questionId);
};

export const endRound = async (gameId, roundId) => {
  const service = new MixedRoundService(gameId);
  return service.endRound();
};

/* =============================================================================================================== */
