'use server';

import RoundServiceFactory from '@/backend/services/round/RoundServiceFactory';
import { RoundType } from '@/models/rounds/round-type';

export const startRound = async (roundType: RoundType, gameId: string, roundId: string) => {
  const roundService = RoundServiceFactory.createService(roundType, gameId);
  await roundService.startRound(roundId);
};

export const handleRoundSelected = async (roundType: RoundType, gameId: string, roundId: string, userId: string) => {
  const roundService = RoundServiceFactory.createService(roundType, gameId);
  await roundService.handleRoundSelected(roundId, userId);
};

export const handleQuestionEnd = async (roundType: RoundType, gameId: string, roundId: string, questionId: string) => {
  const roundService = RoundServiceFactory.createService(roundType, gameId);
  await roundService.handleQuestionEnd(roundId, questionId);
};
