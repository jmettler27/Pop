'use server';

import GameMatchingQuestionService from '@/backend/services/question/matching/GameMatchingQuestionService';
import { MatchingEdgeData } from '@/models/questions/matching';

export const resetQuestion = async (gameId: string, roundId: string, questionId: string) => {
  const service = new GameMatchingQuestionService(gameId, roundId);
  return service.resetQuestion(questionId);
};

export const endQuestion = async (gameId: string, roundId: string, questionId: string) => {
  const service = new GameMatchingQuestionService(gameId, roundId);
  return service.endQuestion(questionId);
};

export const handleCountdownEnd = async (gameId: string, roundId: string, questionId: string) => {
  const service = new GameMatchingQuestionService(gameId, roundId);
  return service.handleCountdownEnd(questionId);
};

/* =============================================================================================================== */

export const submitMatch = async (
  gameId: string,
  roundId: string,
  questionId: string,
  userId: string,
  edges: MatchingEdgeData[],
  match: any
) => {
  const service = new GameMatchingQuestionService(gameId, roundId);
  return service.submitMatch(questionId, userId, edges, match);
};
