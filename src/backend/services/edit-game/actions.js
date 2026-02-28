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

export const removeQuestionFromRound = async (gameId, roundId, questionId) => {
  const service = new EditGameService(gameId);
  return service.removeQuestionFromRound(roundId, questionId);
};

export const updateRound = async (gameId, roundId, roundData) => {
  const service = new EditGameService(gameId);
  return service.updateRound(roundId, roundData);
};

// export const addOrganizerToGame = async (gameId, organizerId) => {
//   const service = new EditGameService(gameId);
//   return service.addOrganizerToGame(organizerId);
// };

export const launchGame = async (gameId) => {
  const service = new EditGameService(gameId);
  return service.launchGame();
};
