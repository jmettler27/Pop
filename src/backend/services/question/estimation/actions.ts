'use server';

import GameEstimationQuestionService from '@/backend/services/question/estimation/GameEstimationQuestionService';
import { EstimationBet } from '@/models/questions/estimation';

export const resetQuestion = async (gameId: string, roundId: string, questionId: string) => {
  const service = new GameEstimationQuestionService(gameId, roundId);
  return service.resetQuestion(questionId);
};

export const endQuestion = async (gameId: string, roundId: string, questionId: string) => {
  const service = new GameEstimationQuestionService(gameId, roundId);
  return service.endQuestion(questionId);
};

export const handleCountdownEnd = async (gameId: string, roundId: string, questionId: string) => {
  const service = new GameEstimationQuestionService(gameId, roundId);
  return service.handleCountdownEnd(questionId);
};

/* =============================================================================================================== */

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
