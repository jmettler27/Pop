"use server";

import MCQRoundService from "@/backend/services/round/mcq/MCQRoundService";


export const handleRoundSelected = async (gameId, roundId, userId) => {
    const service = new MCQRoundService(gameId, roundId);
    return service.handleRoundSelected(userId);
};

export const startRound = async (gameId, roundId) => {
    const service = new MCQRoundService(gameId, roundId);
    return service.startRound();
};

export const handleQuestionEnd = async (gameId, roundId) => {
    const service = new MCQRoundService(gameId, roundId);
    return service.handleQuestionEnd();
};

export const endRound = async (gameId, roundId) => {
    const service = new MCQRoundService(gameId, roundId);
    return service.endRound();
};

/* ============================================================================================================ */
