'use server';

import RoundServiceFactory from '@/backend/services/round/RoundServiceFactory';

export const startRound = async (roundType, gameId, roundId) => {
  const roundService = RoundServiceFactory.createService(roundType, gameId);
  await roundService.startRound(roundId);
};

export const handleRoundSelected = async (roundType, gameId, roundId, userId) => {
  const roundService = RoundServiceFactory.createService(roundType, gameId);
  await roundService.handleRoundSelected(roundId, userId);
};

export const handleQuestionEnd = async (roundType, gameId, roundId, questionId) => {
  const roundService = RoundServiceFactory.createService(roundType, gameId);
  await roundService.handleQuestionEnd(roundId, questionId);
};
