'use server';

import GameEstimationQuestionService from '@/backend/services/question/estimation/GameEstimationQuestionService';
import { EstimationBet } from '@/models/questions/estimation';

export const submitBet = async (
  gameId: string,
  roundId: string,
  questionId: string,
  playerId: string,
  teamId: string,
  bet: EstimationBet
) => {
  const service = new GameEstimationQuestionService(gameId, roundId);
  return service.submitBet(questionId, playerId, teamId, bet);
};
