'use server';

import MixedRoundService from '@/backend/services/round/mixed/MixedRoundService';

export const handleRoundSelected = async (gameId: string, roundId: string, userId: string) => {
  const service = new MixedRoundService(gameId);
  return service.handleRoundSelected(roundId, userId);
};

export const startRound = async (gameId: string, roundId: string) => {
  const service = new MixedRoundService(gameId);
  return service.startRound(roundId);
};

export const handleQuestionEnd = async (gameId: string, roundId: string, questionId: string) => {
  const service = new MixedRoundService(gameId);
  return service.handleQuestionEnd(roundId, questionId);
};

export const endRound = async (gameId: string, roundId: string) => {
  const service = new MixedRoundService(gameId);
  return service.endRound(roundId);
};

/* =============================================================================================================== */
