'use server';

import ProgressiveCluesRoundService from '@/backend/services/round/progressive-clues/ProgressiveCluesRoundService';

export const handleRoundSelected = async (gameId, roundId, userId) => {
  const service = new ProgressiveCluesRoundService(gameId);
  return service.handleRoundSelected(userId);
};

export const startRound = async (gameId, roundId) => {
  const service = new ProgressiveCluesRoundService(gameId);
  return service.startRound(roundId);
};

export const handleQuestionEnd = async (gameId, roundId, questionId) => {
  const service = new ProgressiveCluesRoundService(gameId);
  return service.handleQuestionEnd(roundId, questionId);
};

export const endRound = async (gameId, roundId) => {
  const service = new ProgressiveCluesRoundService(gameId);
  return service.endRound();
};

/* =============================================================================================================== */
