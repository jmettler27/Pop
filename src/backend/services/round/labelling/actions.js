'use server';

import LabellingRoundService from '@/backend/services/round/labelling/LabellingRoundService';

export const handleRoundSelected = async (gameId, roundId, userId) => {
  const service = new LabellingRoundService(gameId);
  return service.handleRoundSelected(userId);
};

export const startRound = async (gameId, roundId) => {
  const service = new LabellingRoundService(gameId);
  return service.startRound();
};

export const handleQuestionEnd = async (gameId, roundId, questionId) => {
  const service = new LabellingRoundService(gameId);
  return service.handleQuestionEnd(roundId, questionId);
};

export const endRound = async (gameId, roundId) => {
  const service = new LabellingRoundService(gameId);
  return service.endRound();
};

/* =============================================================================================================== */
