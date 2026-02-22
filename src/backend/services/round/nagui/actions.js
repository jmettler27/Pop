'use server';

import NaguiRoundService from '@/backend/services/round/nagui/NaguiRoundService';

export const handleRoundSelected = async (gameId, roundId, userId) => {
  const service = new NaguiRoundService(gameId);
  return service.handleRoundSelected(userId);
};

export const startRound = async (gameId, roundId) => {
  const service = new NaguiRoundService(gameId);
  return service.startRound();
};

export const handleQuestionEnd = async (gameId, roundId, questionId) => {
  const service = new NaguiRoundService(gameId);
  return service.handleQuestionEnd(roundId, questionId);
};

export const endRound = async (gameId, roundId) => {
  const service = new NaguiRoundService(gameId);
  return service.endRound();
};

/* =============================================================================================================== */
