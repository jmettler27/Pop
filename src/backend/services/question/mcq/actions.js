'use server';

import GameMCQQuestionService from '@/backend/services/question/mcq/GameMCQQuestionService';

export const resetQuestion = async (gameId, roundId, questionId) => {
  const service = new GameMCQQuestionService(gameId, roundId);
  return service.resetQuestion(questionId);
};

export const endQuestion = async (gameId, roundId, questionId) => {
  const service = new GameMCQQuestionService(gameId, roundId);
  return service.endQuestion(questionId);
};

export const handleCountdownEnd = async (gameId, roundId, questionId) => {
  const service = new GameMCQQuestionService(gameId, roundId);
  return service.handleCountdownEnd(questionId);
};

/* ============================================================================================================ */

export const selectChoice = async (gameId, roundId, questionId, playerId, teamId, choiceIdx) => {
  const service = new GameMCQQuestionService(gameId, roundId);
  return service.selectChoice(questionId, playerId, teamId, choiceIdx);
};
