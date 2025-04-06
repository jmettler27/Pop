"use server";

import GameNaguiQuestionService from "@/backend/services/question/nagui/GameNaguiQuestionService";

export const resetQuestion = async (gameId, roundId, questionId) => {
    const service = new GameNaguiQuestionService(gameId, roundId);
    return service.resetQuestion(questionId);
};

export const handleCountdownEnd = async (gameId, roundId, questionId) => {
    const service = new GameNaguiQuestionService(gameId, roundId);
    return service.handleCountdownEnd(questionId);
};

export const endQuestion = async (gameId, roundId, questionId) => {
    const service = new GameNaguiQuestionService(gameId, roundId);
    return service.endQuestion(questionId);
};

/* ============================================================================================================ */

const selectNaguiOption = async (gameId, roundId, questionId, playerId, optionId) => {
    const service = new GameNaguiQuestionService(gameId, roundId);
    return service.selectNaguiOption(questionId, playerId, optionId);
};

const selectNaguiChoice = async (gameId, roundId, questionId, playerId, teamId, choiceIdx) => {
    const service = new GameNaguiQuestionService(gameId, roundId);
    return service.selectNaguiChoice(questionId, playerId, teamId, choiceIdx);
};

const handleNaguiHideAnswer = async (gameId, roundId, questionId, playerId, teamId, correct) => {
    const service = new GameNaguiQuestionService(gameId, roundId);
    return service.handleNaguiHideAnswer(questionId, playerId, teamId, correct);
};

