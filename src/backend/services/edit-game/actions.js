'use server';

import EditGameService from '@/backend/services/edit-game/EditGameService';

export const addRoundToGame = async (gameId, roundTitle, roundType) => {
  const service = new EditGameService(gameId);
  return service.addRoundToGame(roundTitle, roundType);
};

export const removeRoundFromGame = async (gameId, roundId) => {
  const service = new EditGameService(gameId);
  return service.removeRoundFromGame(roundId);
};

export const addQuestionToRound = async (gameId, roundId, questionId, managerId) => {
  const service = new EditGameService(gameId);
  return service.addQuestionToRound(roundId, questionId, managerId);
};

export const removeQuestionFromRound = async (questionType, gameId, roundId, questionId) => {
  const service = new EditGameService(gameId);
  return service.removeQuestionFromRound(questionType, roundId, questionId);
};

export const updateRound = async (gameId, roundId, roundData) => {
  const service = new EditGameService(gameId);
  return service.updateRound(roundId, roundData);
};

// export const addOrganizerToGame = async (gameId, organizerId) => {
//   const service = new EditGameService(gameId);
//   return service.addOrganizerToGame(organizerId);
// };

export const updateRoundThinkingTime = async (gameId, roundId, thinkingTime) => {
  const service = new EditGameService(gameId);
  return service.updateRoundThinkingTime(roundId, thinkingTime);
};

export const updateQuestionThinkingTime = async (gameId, questionType, roundId, questionId, thinkingTime) => {
  const service = new EditGameService(gameId);
  return service.updateQuestionThinkingTime(questionType, roundId, questionId, thinkingTime);
};

export const updateRoundChallengeTime = async (gameId, roundId, challengeTime) => {
  const service = new EditGameService(gameId);
  return service.updateRoundChallengeTime(roundId, challengeTime);
};

export const updateQuestionChallengeTime = async (gameId, questionType, roundId, questionId, challengeTime) => {
  const service = new EditGameService(gameId);
  return service.updateQuestionChallengeTime(questionType, roundId, questionId, challengeTime);
};

export const launchGame = async (gameId) => {
  const service = new EditGameService(gameId);
  return service.launchGame();
};
