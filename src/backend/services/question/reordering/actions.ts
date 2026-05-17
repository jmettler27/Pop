'use server';

import GameReorderingQuestionService from '@/backend/services/question/reordering/GameReorderingQuestionService';
import { SubmittedOrdering } from '@/models/questions/reordering';

export const resetQuestion = async (gameId: string, roundId: string, questionId: string) => {
  const service = new GameReorderingQuestionService(gameId, roundId);
  return service.resetQuestion(questionId);
};

export const endQuestion = async (gameId: string, roundId: string, questionId: string) => {
  const service = new GameReorderingQuestionService(gameId, roundId);
  return service.endQuestion(questionId);
};

export const handleCountdownEnd = async (gameId: string, roundId: string, questionId: string) => {
  const service = new GameReorderingQuestionService(gameId, roundId);
  return service.handleCountdownEnd(questionId);
};

/* =============================================================================================================== */

export const submitOrdering = async (
  gameId: string,
  roundId: string,
  questionId: string,
  playerId: string,
  teamId: string,
  ordering: SubmittedOrdering
) => {
  const service = new GameReorderingQuestionService(gameId, roundId);
  return service.submitOrdering(questionId, playerId, teamId, ordering);
};
