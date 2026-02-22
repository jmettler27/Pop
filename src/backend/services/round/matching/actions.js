'use server';

import MatchingRoundService from '@/backend/services/round/matching/MatchingRoundService';

export const handleRoundSelected = async (gameId, roundId, userId) => {
  const service = new MatchingRoundService(gameId);
  return service.handleRoundSelected(userId);
};

export const startRound = async (gameId, roundId) => {
  const service = new MatchingRoundService(gameId);
  return service.startRound();
};

export const handleQuestionEnd = async (gameId, roundId, questionId) => {
  const service = new MatchingRoundService(gameId);
  return service.handleQuestionEnd(roundId, questionId);
};

export const endRound = async (gameId, roundId) => {
  const service = new MatchingRoundService(gameId);
  return service.endRound();
};

/* =============================================================================================================== */
