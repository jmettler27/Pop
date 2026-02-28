'use server';

import BlindtestRoundService from '@/backend/services/round/blindtest/BlindtestRoundService';

export const handleRoundSelected = async (gameId, roundId, userId) => {
  const service = new BlindtestRoundService(gameId);
  return service.handleRoundSelected(userId);
};

export const startRound = async (gameId, roundId) => {
  const service = new BlindtestRoundService(gameId);
  return service.startRound(roundId);
};

export const handleQuestionEnd = async (gameId, roundId, questionId) => {
  const service = new BlindtestRoundService(gameId);
  return service.handleQuestionEnd(roundId, questionId);
};

export const endRound = async (gameId, roundId) => {
  const service = new BlindtestRoundService(gameId);
  return service.endRound();
};

/* =============================================================================================================== */
