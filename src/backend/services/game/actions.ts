'use server';

import GameService from '@/backend/services/game/GameService';

/**
 *
 * @param gameId
 * @returns {Promise<void>}
 */
export const startGame = async (gameId: string) => {
  const service = new GameService(gameId);
  return service.startGame();
};

/**
 *
 * @param gameId
 * @returns {Promise<*>}
 */
export const resetGame = async (gameId: string) => {
  const service = new GameService(gameId);
  return service.resetGame();
};

/**
 * Returns to game home
 *
 * @param {string} gameId - The ID of the game
 */
export const returnToGameHome = async (gameId: string) => {
  const service = new GameService(gameId);
  return service.returnToGameHome();
};

/**
 * Resume editing
 *
 * @param {string} gameId - The ID of the game
 */
export const resumeEditing = async (gameId: string) => {
  const service = new GameService(gameId);
  return service.resumeEditing();
};

/**
 * Ends a game
 *
 * @param {string} gameId - The ID of the game
 */
export const endGame = async (gameId: string) => {
  const service = new GameService(gameId);
  return service.endGame();
};

/**
 * Retrieves all ended games where the given user is an organizer or a player
 *
 * @param {string} userId - The ID of the user
 */
export const getEndedGames = async (userId: string) => {
  return GameService.getEndedGamesForUser(userId);
};

/**
 * Retrieves all games under construction where the given user is an organizer or a player
 *
 * @param {string} userId - The ID of the user
 */
export const getGamesUnderConstruction = async (userId: string) => {
  return GameService.getGamesUnderConstructionForUser(userId);
};
