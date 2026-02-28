'use server';

import GameQuestionServiceFactory from '@/backend/services/question/GameQuestionServiceFactory';

export const endQuestion = async (gameId, roundId, questionId, questionType) => {
  const gameQuestionService = GameQuestionServiceFactory.createService(questionType, gameId, roundId);
  await gameQuestionService.endQuestion(questionId);
};

export const resetQuestion = async (gameId, roundId, questionId, questionType) => {
  const gameQuestionService = GameQuestionServiceFactory.createService(questionType, gameId, roundId);
  await gameQuestionService.resetQuestion(questionId);
};

export const handleCountdownEnd = async (questionType, gameId, roundId, questionId) => {
  const gameQuestionService = GameQuestionServiceFactory.createService(questionType, gameId, roundId);
  await gameQuestionService.handleCountdownEnd(questionId);
};
