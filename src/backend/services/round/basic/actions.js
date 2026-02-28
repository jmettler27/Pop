'use server';

import BasicRoundService from '@/backend/services/round/basic/BasicRoundService';

export const handleRoundSelected = async (gameId, roundId, userId) => {
  const service = new BasicRoundService(gameId);
  return service.handleRoundSelected(userId);
};

export const startRound = async (gameId, roundId) => {
  const service = new BasicRoundService(gameId);
  return service.startRound(roundId);
};

export const handleQuestionEnd = async (gameId, roundId, questionId) => {
  const service = new BasicRoundService(gameId);
  return service.handleQuestionEnd(roundId, questionId);
};

export const endRound = async (gameId, roundId) => {
  const service = new BasicRoundService(gameId);
  return service.endRound();
};

/* =============================================================================================================== */
