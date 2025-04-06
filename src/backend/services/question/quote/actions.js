"use server";

import GameQuoteQuestionService from "@/backend/services/question/quote/GameQuoteQuestionService";

export const resetQuestion = async (gameId, roundId, questionId) => {
    const service = new GameQuoteQuestionService(gameId, roundId);
    return service.resetQuestion(questionId);
};

export const handleCountdownEnd = async (gameId, roundId, questionId) => {
    const service = new GameQuoteQuestionService(gameId, roundId);
    return service.handleCountdownEnd(questionId);
};

export const endQuestion = async (gameId, roundId, questionId) => {
    const service = new GameQuoteQuestionService(gameId, roundId);
    return service.endQuestion(questionId);
};

/* ============================================================================================================ */

export const revealQuoteElement = async (gameId, roundId, questionId, quoteElem, quotePartIdx = null, wholeTeam = false) => {
    const service = new GameQuoteQuestionService(gameId, roundId);
    return service.revealQuoteElement(questionId, quoteElem, quotePartIdx, wholeTeam);
};

export const validateAllQuoteElements = async (gameId, roundId, questionId, playerId) => {
    const service = new GameQuoteQuestionService(gameId, roundId);
    return service.validateAllQuoteElements(questionId, playerId);
};

export const cancelQuotePlayer = async (gameId, roundId, questionId, playerId, wholeTeam = false) => {
    const service = new GameQuoteQuestionService(gameId, roundId);
    return service.cancelQuotePlayer(questionId, playerId, wholeTeam);
};
