'use server';

import OddOneOutRoundService from '@/backend/services/round/odd-one-out/OddOneOutRoundService';

export const handleRoundSelected = async (gameId: string, roundId: string, userId: string) => {
  const service = new OddOneOutRoundService(gameId);
  return service.handleRoundSelected(roundId, userId);
};

export const startRound = async (gameId: string, roundId: string) => {
  const service = new OddOneOutRoundService(gameId);
  return service.startRound(roundId);
};

export const handleQuestionEnd = async (gameId: string, roundId: string, questionId: string) => {
  const service = new OddOneOutRoundService(gameId);
  return service.handleQuestionEnd(roundId, questionId);
};

export const endRound = async (gameId: string, roundId: string) => {
  const service = new OddOneOutRoundService(gameId);
  return service.endRound(roundId);
};

/* =============================================================================================================== */
