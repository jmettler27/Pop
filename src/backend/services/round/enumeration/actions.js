'use server';

import EnumerationRoundService from '@/backend/services/round/enumeration/EnumerationRoundService';

export const handleRoundSelected = async (gameId, roundId, userId) => {
  const service = new EnumerationRoundService(gameId);
  return service.handleRoundSelected(userId);
};

export const startRound = async (gameId, roundId) => {
  const service = new EnumerationRoundService(gameId);
  return service.startRound(roundId);
};

export const handleQuestionEnd = async (gameId, roundId, questionId) => {
  const service = new EnumerationRoundService(gameId);
  return service.handleQuestionEnd(roundId, questionId);
};

export const endRound = async (gameId, roundId) => {
  const service = new EnumerationRoundService(gameId);
  return service.endRound();
};

/* =============================================================================================================== */
