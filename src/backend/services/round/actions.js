'use server';

import RoundServiceFactory from '@/backend/services/round/RoundServiceFactory';

export const startRound = async (gameId, roundId, roundType) => {
  const roundService = RoundServiceFactory.createService(roundType, gameId);
  await roundService.startRound(roundId);
};
