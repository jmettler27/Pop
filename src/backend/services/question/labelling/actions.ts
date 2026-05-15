'use server';

import GameLabellingQuestionService from '@/backend/services/question/labelling/GameLabellingQuestionService';

export const resetQuestion = async (gameId: string, roundId: string, questionId: string) => {
  const service = new GameLabellingQuestionService(gameId, roundId);
  return service.resetQuestion(questionId);
};

export const endQuestion = async (gameId: string, roundId: string, questionId: string) => {
  const service = new GameLabellingQuestionService(gameId, roundId);
  return service.endQuestion(questionId);
};

export const handleCountdownEnd = async (gameId: string, roundId: string, questionId: string) => {
  const service = new GameLabellingQuestionService(gameId, roundId);
  return service.handleCountdownEnd(questionId);
};

/* =============================================================================================================== */
export const handleBuzzerHeadChanged = async (
  gameId: string,
  roundId: string,
  questionId: string,
  playerId: string
) => {
  const service = new GameLabellingQuestionService(gameId, roundId);
  return service.handleBuzzerHeadChanged(questionId, playerId);
};

export const revealLabel = async (gameId: string, roundId: string, questionId: string, labelIdx: number) => {
  const service = new GameLabellingQuestionService(gameId, roundId);
  return service.revealLabel(questionId, labelIdx);
};

export const validateAllLabels = async (gameId: string, roundId: string, questionId: string, playerId: string) => {
  const service = new GameLabellingQuestionService(gameId, roundId);
  return service.validateAllLabels(questionId, playerId);
};

export const cancelPlayer = async (gameId: string, roundId: string, questionId: string, playerId: string) => {
  const service = new GameLabellingQuestionService(gameId, roundId);
  return service.cancelPlayer(questionId, playerId);
};
