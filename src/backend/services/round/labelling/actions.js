'use server';

import LabellingRoundService from '@/backend/services/round/labelling/LabellingRoundService';

export const handleRoundSelected = async (gameId, roundId, userId) => {
  const service = new LabellingRoundService(gameId, roundId);
  return service.handleRoundSelected(userId);
};

export const startRound = async (gameId, roundId) => {
  const service = new LabellingRoundService(gameId, roundId);
  return service.startRound();
};

export const handleQuestionEnd = async (gameId, roundId) => {
  const service = new LabellingRoundService(gameId, roundId);
  return service.handleQuestionEnd();
};

export const endRound = async (gameId, roundId) => {
  const service = new LabellingRoundService(gameId, roundId);
  return service.endRound();
};

/* ============================================================================================================ */
