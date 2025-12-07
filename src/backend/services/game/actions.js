"use server";

import GameService from "@/backend/services/game/GameService";


export const startGame = async (gameId) => {
    const service = new GameService(gameId);
    return service.startGame();
};

/**
 * Returns to game home
 * 
 * @param {string} gameId - The ID of the game
 */
export const returnToGameHome = async (gameId) => {
    const service = new GameService(gameId);
    return service.returnToGameHome();
};

/**
 * Resume editing
 * 
 * @param {string} gameId - The ID of the game
 */
export const resumeEditing = async (gameId) => {
    const service = new GameService(gameId);
    return service.resumeEditing();
};

/**
 * Ends a game
 * 
 * @param {string} gameId - The ID of the game
 */
export const endGame = async (gameId) => {
    const service = new GameService(gameId);
    return service.endGame();
};

