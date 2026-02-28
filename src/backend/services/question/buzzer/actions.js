'use server';

import GameQuestionServiceFactory from '@/backend/services/question/GameQuestionServiceFactory';

export const handleBuzzerHeadChanged = async (questionType, gameId, roundId, questionId, playerId) => {
  const gameQuestionService = GameQuestionServiceFactory.createService(questionType, gameId, roundId);
  await gameQuestionService.handleBuzzerHeadChanged(questionId, playerId);
};

export const invalidateAnswer = async (questionType, gameId, roundId, questionId, playerId) => {
  const gameQuestionService = GameQuestionServiceFactory.createService(questionType, gameId, roundId);
  await gameQuestionService.invalidateAnswer(questionId, playerId);
};

export const validateAnswer = async (questionType, gameId, roundId, questionId, playerId) => {
  const gameQuestionService = GameQuestionServiceFactory.createService(questionType, gameId, roundId);
  await gameQuestionService.validateAnswer(questionId, playerId);
};

export const addPlayerToBuzzer = async (questionType, gameId, roundId, questionId, playerId) => {
  const gameQuestionService = GameQuestionServiceFactory.createService(questionType, gameId, roundId);
  await gameQuestionService.addPlayerToBuzzer(questionId, playerId);
};

export const removePlayerFromBuzzer = async (questionType, gameId, roundId, questionId, playerId) => {
  const gameQuestionService = GameQuestionServiceFactory.createService(questionType, gameId, roundId);
  await gameQuestionService.removePlayerFromBuzzer(questionId, playerId);
};

export const clearBuzzer = async (questionType, gameId, roundId, questionId) => {
  const gameQuestionService = GameQuestionServiceFactory.createService(questionType, gameId, roundId);
  await gameQuestionService.clearBuzzer(questionId);
};
