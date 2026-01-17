"use server";

import GameProgressiveCluesQuestionService from "@/backend/services/question/progressive-clues/GameProgressiveCluesQuestionService";


export const resetQuestion = async (gameId, roundId, questionId) => {
    const service = new GameProgressiveCluesQuestionService(gameId, roundId);
    return service.resetQuestion(questionId);
};

export const endQuestion = async (gameId, roundId, questionId) => {
    const service = new GameProgressiveCluesQuestionService(gameId, roundId);
    return service.endQuestion(questionId);
};

export const handleCountdownEnd = async (gameId, roundId, questionId) => {
    const service = new GameProgressiveCluesQuestionService(gameId, roundId);
    return service.handleCountdownEnd(questionId);
};

/* ============================================================================================================ */

export const handleBuzzerHeadChanged = async (gameId, roundId, playerId) => {
    const service = new GameProgressiveCluesQuestionService(gameId, roundId);
    return service.handleBuzzerHeadChanged(playerId);
};

export const addPlayerToBuzzer = async (gameId, roundId, questionId, playerId) => {
    const service = new GameProgressiveCluesQuestionService(gameId, roundId);
    return service.addPlayerToBuzzer(questionId, playerId);
};

export const removePlayerFromBuzzer = async (gameId, roundId, questionId, playerId) => {
    const service = new GameProgressiveCluesQuestionService(gameId, roundId);
    return service.removePlayerFromBuzzer(questionId, playerId);
};

export const clearBuzzer = async (gameId, roundId, questionId) => {
    const service = new GameProgressiveCluesQuestionService(gameId, roundId);
    return service.clearBuzzer(questionId);
};

export const validateAnswer = async (gameId, roundId, questionId, playerId, wholeTeam = false) => {
    const service = new GameProgressiveCluesQuestionService(gameId, roundId);
    return service.validateAnswer(questionId, playerId, wholeTeam);
};

export const invalidateAnswer = async (gameId, roundId, questionId, playerId) => {
    const service = new GameProgressiveCluesQuestionService(gameId, roundId);
    return service.invalidateAnswer(questionId, playerId);
};

/* ============================================================================================================ */

export const revealClue = async (gameId, roundId, questionId) => {
    const service = new GameProgressiveCluesQuestionService(gameId, roundId);
    return service.revealClue(questionId);
};
