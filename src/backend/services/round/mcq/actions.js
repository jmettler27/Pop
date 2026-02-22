'use server';

import MCQRoundService from '@/backend/services/round/mcq/MCQRoundService';

export const handleRoundSelected = async (gameId, roundId, userId) => {
  const service = new MCQRoundService(gameId);
  return service.handleRoundSelected(userId);
};

export const startRound = async (gameId, roundId) => {
  const service = new MCQRoundService(gameId);
  return service.startRound();
};

export const handleQuestionEnd = async (gameId, roundId, questionId) => {
  const service = new MCQRoundService(gameId);
  return service.handleQuestionEnd(roundId, questionId);
};

export const endRound = async (gameId, roundId) => {
  const service = new MCQRoundService(gameId);
  return service.endRound();
};

/* =============================================================================================================== */
