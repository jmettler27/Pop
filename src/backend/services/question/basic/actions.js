"use server";

import GameBasicQuestionService from "@/backend/services/question/basic/GameBasicQuestionService";

export const resetQuestion = async (gameId, roundId, questionId) => {
    const service = new GameBasicQuestionService(gameId, roundId);
    return service.resetQuestion(questionId);
};

export const handleCountdownEnd = async (gameId, roundId, questionId) => {
    const service = new GameBasicQuestionService(gameId, roundId);
    return service.handleCountdownEnd(questionId);
};

export const endQuestion = async (gameId, roundId, questionId) => {
    const service = new GameBasicQuestionService(gameId, roundId);
    return service.endQuestion(questionId);
};

/* ============================================================================================================ */

export const handleBuzzerHeadChanged = async (gameId, roundId, playerId) => {
    const service = new GameBasicQuestionService(gameId, roundId);
    return service.handleBuzzerHeadChanged(playerId);
};

export const addPlayerToBuzzer = async (gameId, roundId, questionId, playerId) => {
    const service = new GameBasicQuestionService(gameId, roundId);
    return service.addPlayerToBuzzer(questionId, playerId);
};

export const removePlayerFromBuzzer = async (gameId, roundId, questionId, playerId) => {
    const service = new GameBasicQuestionService(gameId, roundId);
    return service.removePlayerFromBuzzer(questionId, playerId);
};

export const clearBuzzer = async (gameId, roundId, questionId) => {
    const service = new GameBasicQuestionService(gameId, roundId);
    return service.clearBuzzer(questionId);
};

export const handleAnswer = async (gameId, roundId, questionId, teamId, correct = false) => {
    const service = new GameBasicQuestionService(gameId, roundId);
    return service.handleAnswer(questionId, teamId, correct);
};
