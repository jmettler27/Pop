'use server';

import ProgressiveCluesRoundService from '@/backend/services/round/progressive-clues/ProgressiveCluesRoundService';

export const handleRoundSelected = async (gameId, roundId, userId) => {
  const service = new ProgressiveCluesRoundService(gameId, roundId);
  return service.handleRoundSelected(userId);
};

export const startRound = async (gameId, roundId) => {
  const service = new ProgressiveCluesRoundService(gameId, roundId);
  return service.startRound();
};

export const handleQuestionEnd = async (gameId, roundId) => {
  const service = new ProgressiveCluesRoundService(gameId, roundId);
  return service.handleQuestionEnd();
};

export const endRound = async (gameId, roundId) => {
  const service = new ProgressiveCluesRoundService(gameId, roundId);
  return service.endRound();
};

/* ============================================================================================================ */
