"use server";

import GameEnumerationQuestionService from "@/backend/services/question/enumeration/GameEnumerationQuestionService";

export const resetQuestion = async (gameId, roundId, questionId) => {
    const service = new GameEnumerationQuestionService(gameId, roundId);
    return service.resetQuestion(questionId);
};

export const handleCountdownEnd = async (gameId, roundId, questionId) => {
    const service = new GameEnumerationQuestionService(gameId, roundId);
    return service.handleCountdownEnd(questionId);
};

export const endQuestion = async (gameId, roundId, questionId) => {
    const service = new GameEnumerationQuestionService(gameId, roundId);
    return service.endQuestion(questionId);
};

/* ============================================================================================================ */

export const addPlayerBet = async (gameId, roundId, questionId, playerId, teamId, bet) => {
    const service = new GameEnumerationQuestionService(gameId, roundId);
    return service.addPlayerBet(questionId, playerId, teamId, bet);
};


export const endReflection = async (gameId, roundId, questionId) => {
    const service = new GameEnumerationQuestionService(gameId, roundId);
    return service.endReflection(questionId);
};

export const validateItem = async (gameId, roundId, questionId, itemIdx) => {
    const service = new GameEnumerationQuestionService(gameId, roundId);
    return service.validateItem(questionId, itemIdx);
};

