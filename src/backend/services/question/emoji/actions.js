"use server";

import GameEmojiQuestionService from "@/backend/services/question/emoji/GameEmojiQuestionService";


/**
 * Resets the question.
 * 
 * @param {*} gameId 
 * @param {*} roundId 
 * @param {*} questionId 
 * @returns 
 */
export const resetQuestion = async (gameId, roundId, questionId) => {
    const service = new GameEmojiQuestionService(gameId, roundId);
    return service.resetQuestion(questionId);
};

/**
 * Ends the question.
 * 
 * @param {*} gameId 
 * @param {*} roundId 
 * @param {*} questionId 
 * @returns 
 */
export const endQuestion = async (gameId, roundId, questionId) => {
    const service = new GameEmojiQuestionService(gameId, roundId);
    return service.endQuestion(questionId);
};

/**
 * Handles the countdown end event.
 * 
 * @param {*} gameId 
 * @param {*} roundId 
 * @param {*} questionId 
 * @returns 
 */
export const handleCountdownEnd = async (gameId, roundId, questionId) => {
    const service = new GameEmojiQuestionService(gameId, roundId);
    return service.handleCountdownEnd(questionId);
};

/* ============================================================================================================ */

/**
 * Handles the buzzer head changed event.
 * 
 * @param {*} gameId 
 * @param {*} roundId 
 * @param {*} playerId 
 * @returns 
 */
export const handleBuzzerHeadChanged = async (gameId, roundId, playerId) => {
    const service = new GameEmojiQuestionService(gameId, roundId);
    return service.handleBuzzerHeadChanged(playerId);
};

/**
 * Validates the answer of a player.
 * 
 * @param {*} gameId 
 * @param {*} roundId 
 * @param {*} questionId 
 * @param {*} playerId 
 * @param {*} wholeTeam 
 * @returns 
 */
export const validateAnswer = async (gameId, roundId, questionId, playerId, wholeTeam = false) => {
    const service = new GameEmojiQuestionService(gameId, roundId);
    return service.validateAnswer(questionId, playerId, wholeTeam);
};

/**
 * Invalidates the answer of a player.
 * 
 * @param {*} gameId 
 * @param {*} roundId 
 * @param {*} questionId 
 * @param {*} playerId 
 * @returns 
 */
export const invalidateAnswer = async (gameId, roundId, questionId, playerId) => {
    const service = new GameEmojiQuestionService(gameId, roundId);
    return service.invalidateAnswer(questionId, playerId);
};

/**
 * Adds a player to the buzzer.
 * 
 * @param {*} gameId 
 * @param {*} roundId 
 * @param {*} questionId 
 * @param {*} playerId 
 * @returns 
 */
export const addPlayerToBuzzer = async (gameId, roundId, questionId, playerId) => {
    const service = new GameEmojiQuestionService(gameId, roundId);
    return service.addPlayerToBuzzer(questionId, playerId);
};

/**
 * Removes a player from the buzzer.
 * 
 * @param {*} gameId 
 * @param {*} roundId 
 * @param {*} questionId 
 * @param {*} playerId 
 * @returns 
 */
export const removePlayerFromBuzzer = async (gameId, roundId, questionId, playerId) => {
    const service = new GameEmojiQuestionService(gameId, roundId);
    return service.removePlayerFromBuzzer(questionId, playerId);
};

/**
 * 
 * Clears the buzzer.
 * 
 * @param {*} gameId 
 * @param {*} roundId 
 * @param {*} questionId 
 * @returns 
 */
export const clearBuzzer = async (gameId, roundId, questionId) => {
    const service = new GameEmojiQuestionService(gameId, roundId);
    return service.clearBuzzer(questionId);
};
