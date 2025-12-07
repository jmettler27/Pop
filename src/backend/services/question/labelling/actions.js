"use server";

import GameLabellingQuestionService from "@/backend/services/question/labelling/GameLabellingQuestionService";


export const resetQuestion = async (gameId, roundId, questionId) => {
    const service = new GameLabellingQuestionService(gameId, roundId);
    return service.resetQuestion(questionId);
};

export const endQuestion = async (gameId, roundId, questionId) => {
    const service = new GameLabellingQuestionService(gameId, roundId);
    return service.endQuestion(questionId);
};  

export const handleCountdownEnd = async (gameId, roundId, questionId) => {
    const service = new GameLabellingQuestionService(gameId, roundId);
    return service.handleCountdownEnd(questionId);
};

/* ============================================================================================================ */

export const revealLabel = async (gameId, roundId, questionId, labelIdx, wholeTeam = false) => {
    const service = new GameLabellingQuestionService(gameId, roundId);
    return service.revealLabel(questionId, labelIdx, wholeTeam);
};

export const validateAllLabels = async (gameId, roundId, questionId, playerId) => {
    const service = new GameLabellingQuestionService(gameId, roundId);
    return service.validateAllLabels(questionId, playerId);
};

export const cancelPlayerLabel = async (gameId, roundId, questionId, playerId, wholeTeam = false) => {
    const service = new GameLabellingQuestionService(gameId, roundId);
    return service.cancelPlayer(questionId, playerId, wholeTeam);
};
