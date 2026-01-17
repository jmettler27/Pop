'use server';

import OddOneOutRoundService from '@/backend/services/round/odd-one-out/OddOneOutRoundService';

export const handleRoundSelected = async (gameId, roundId, userId) => {
  const service = new OddOneOutRoundService(gameId, roundId);
  return service.handleRoundSelected(userId);
};

export const startRound = async (gameId, roundId) => {
  const service = new OddOneOutRoundService(gameId, roundId);
  return service.startRound();
};

export const handleQuestionEnd = async (gameId, roundId) => {
  const service = new OddOneOutRoundService(gameId, roundId);
  return service.handleQuestionEnd();
};

export const endRound = async (gameId, roundId) => {
  const service = new OddOneOutRoundService(gameId, roundId);
  return service.endRound();
};

/* ============================================================================================================ */
