'use server';

import MCQRoundService from '@/backend/services/round/mcq/MCQRoundService';

export const handleRoundSelected = async (gameId: string, roundId: string, userId: string) => {
  const service = new MCQRoundService(gameId);
  return service.handleRoundSelected(roundId, userId);
};

export const startRound = async (gameId: string, roundId: string) => {
  const service = new MCQRoundService(gameId);
  return service.startRound(roundId);
};

export const handleQuestionEnd = async (gameId: string, roundId: string, questionId: string) => {
  const service = new MCQRoundService(gameId);
  return service.handleQuestionEnd(roundId, questionId);
};

export const endRound = async (gameId: string, roundId: string) => {
  const service = new MCQRoundService(gameId);
  return service.endRound(roundId);
};

/* =============================================================================================================== */
