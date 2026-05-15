'use server';

import GameOddOneOutQuestionService from '@/backend/services/question/odd-one-out/GameOddOneOutQuestionService';

export const resetQuestion = async (gameId: string, roundId: string, questionId: string) => {
  const service = new GameOddOneOutQuestionService(gameId, roundId);
  return service.resetQuestion(questionId);
};

export const endQuestion = async (gameId: string, roundId: string, questionId: string) => {
  const service = new GameOddOneOutQuestionService(gameId, roundId);
  return service.endQuestion(questionId);
};

export const handleCountdownEnd = async (gameId: string, roundId: string, questionId: string) => {
  const service = new GameOddOneOutQuestionService(gameId, roundId);
  return service.handleCountdownEnd(questionId);
};

/* =============================================================================================================== */

export const selectProposal = async (
  gameId: string,
  roundId: string,
  questionId: string,
  playerId: string,
  idx: number
) => {
  const service = new GameOddOneOutQuestionService(gameId, roundId);
  return service.selectProposal(questionId, playerId, idx);
};
