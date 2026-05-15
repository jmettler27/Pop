'use server';

import GameProgressiveCluesQuestionService from '@/backend/services/question/progressive-clues/GameProgressiveCluesQuestionService';

export const resetQuestion = async (gameId: string, roundId: string, questionId: string) => {
  const service = new GameProgressiveCluesQuestionService(gameId, roundId);
  return service.resetQuestion(questionId);
};

export const endQuestion = async (gameId: string, roundId: string, questionId: string) => {
  const service = new GameProgressiveCluesQuestionService(gameId, roundId);
  return service.endQuestion(questionId);
};

export const handleCountdownEnd = async (gameId: string, roundId: string, questionId: string) => {
  const service = new GameProgressiveCluesQuestionService(gameId, roundId);
  return service.handleCountdownEnd(questionId);
};

/* =============================================================================================================== */

export const handleBuzzerHeadChanged = async (
  gameId: string,
  roundId: string,
  questionId: string,
  playerId: string
) => {
  const service = new GameProgressiveCluesQuestionService(gameId, roundId);
  return service.handleBuzzerHeadChanged(questionId, playerId);
};

export const addPlayerToBuzzer = async (gameId: string, roundId: string, questionId: string, playerId: string) => {
  const service = new GameProgressiveCluesQuestionService(gameId, roundId);
  return service.addPlayerToBuzzer(questionId, playerId);
};

export const removePlayerFromBuzzer = async (gameId: string, roundId: string, questionId: string, playerId: string) => {
  const service = new GameProgressiveCluesQuestionService(gameId, roundId);
  return service.removePlayerFromBuzzer(questionId, playerId);
};

export const clearBuzzer = async (gameId: string, roundId: string, questionId: string) => {
  const service = new GameProgressiveCluesQuestionService(gameId, roundId);
  return service.clearBuzzer(questionId);
};

export const validateAnswer = async (gameId: string, roundId: string, questionId: string, playerId: string) => {
  const service = new GameProgressiveCluesQuestionService(gameId, roundId);
  return service.validateAnswer(questionId, playerId);
};

export const invalidateAnswer = async (gameId: string, roundId: string, questionId: string, playerId: string) => {
  const service = new GameProgressiveCluesQuestionService(gameId, roundId);
  return service.invalidateAnswer(questionId, playerId);
};

/* =============================================================================================================== */

export const revealClue = async (gameId: string, roundId: string, questionId: string) => {
  const service = new GameProgressiveCluesQuestionService(gameId, roundId);
  return service.revealClue(questionId);
};
