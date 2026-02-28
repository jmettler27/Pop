'use server';

import GameNaguiQuestionService from '@/backend/services/question/nagui/GameNaguiQuestionService';

export const resetQuestion = async (gameId, roundId, questionId) => {
  const service = new GameNaguiQuestionService(gameId, roundId);
  return service.resetQuestion(questionId);
};

export const endQuestion = async (gameId, roundId, questionId) => {
  const service = new GameNaguiQuestionService(gameId, roundId);
  return service.endQuestion(questionId);
};

export const handleCountdownEnd = async (gameId, roundId, questionId) => {
  const service = new GameNaguiQuestionService(gameId, roundId);
  return service.handleCountdownEnd(questionId);
};

/* =============================================================================================================== */

export const selectOption = async (gameId, roundId, questionId, playerId, optionId) => {
  const service = new GameNaguiQuestionService(gameId, roundId);
  return service.selectOption(questionId, playerId, optionId);
};

export const selectChoice = async (gameId, roundId, questionId, playerId, teamId, choiceIdx) => {
  const service = new GameNaguiQuestionService(gameId, roundId);
  return service.selectChoice(questionId, playerId, teamId, choiceIdx);
};

export const handleHideAnswer = async (gameId, roundId, questionId, playerId, teamId, correct) => {
  const service = new GameNaguiQuestionService(gameId, roundId);
  return service.handleHideAnswer(questionId, playerId, teamId, correct);
};
