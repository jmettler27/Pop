'use server';

import EstimationRoundService from '@/backend/services/round/estimation/EstimationRoundService';

export const handleRoundSelected = async (gameId, roundId, userId) => {
  const service = new EstimationRoundService(gameId);
  return service.handleRoundSelected(userId);
};

export const startRound = async (gameId, roundId) => {
  const service = new EstimationRoundService(gameId);
  return service.startRound(roundId);
};

export const handleQuestionEnd = async (gameId, roundId, questionId) => {
  const service = new EstimationRoundService(gameId);
  return service.handleQuestionEnd(roundId, questionId);
};

export const endRound = async (gameId, roundId) => {
  const service = new EstimationRoundService(gameId);
  return service.endRound();
};

/* =============================================================================================================== */
