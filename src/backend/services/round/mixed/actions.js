'use server';

import MixedRoundService from '@/backend/services/round/mixed/MixedRoundService';

export const handleRoundSelected = async (gameId, roundId, userId) => {
  const service = new MixedRoundService(gameId, roundId);
  return service.handleRoundSelected(userId);
};

export const startRound = async (gameId, roundId) => {
  const service = new MixedRoundService(gameId, roundId);
  return service.startRound();
};

export const handleQuestionEnd = async (gameId, roundId) => {
  const service = new MixedRoundService(gameId, roundId);
  return service.handleQuestionEnd();
};

export const endRound = async (gameId, roundId) => {
  const service = new MixedRoundService(gameId, roundId);
  return service.endRound();
};

/* ============================================================================================================ */
