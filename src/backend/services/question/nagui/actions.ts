'use server';

import GameNaguiQuestionService from '@/backend/services/question/nagui/GameNaguiQuestionService';

export const resetQuestion = async (gameId: string, roundId: string, questionId: string) => {
  const service = new GameNaguiQuestionService(gameId, roundId);
  return service.resetQuestion(questionId);
};

export const endQuestion = async (gameId: string, roundId: string, questionId: string) => {
  const service = new GameNaguiQuestionService(gameId, roundId);
  return service.endQuestion(questionId);
};

export const handleCountdownEnd = async (gameId: string, roundId: string, questionId: string) => {
  const service = new GameNaguiQuestionService(gameId, roundId);
  return service.handleCountdownEnd(questionId);
};

/* =============================================================================================================== */

export const selectOption = async (
  gameId: string,
  roundId: string,
  questionId: string,
  playerId: string,
  optionIdx: number
) => {
  const service = new GameNaguiQuestionService(gameId, roundId);
  return service.selectOption(questionId, playerId, optionIdx);
};

export const selectChoice = async (
  gameId: string,
  roundId: string,
  questionId: string,
  playerId: string,
  teamId: string,
  choiceIdx: number
) => {
  const service = new GameNaguiQuestionService(gameId, roundId);
  return service.selectChoice(questionId, playerId, teamId, choiceIdx);
};

export const handleHideAnswer = async (
  gameId: string,
  roundId: string,
  questionId: string,
  playerId: string,
  teamId: string,
  correct: boolean
) => {
  const service = new GameNaguiQuestionService(gameId, roundId);
  return service.handleHideAnswer(questionId, playerId, teamId, correct);
};
