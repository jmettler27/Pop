"use server";

import NaguiRoundService from "@/backend/services/round/nagui/NaguiRoundService";


export const handleRoundSelected = async (gameId, roundId, userId) => {
    const service = new NaguiRoundService(gameId, roundId);
    return service.handleRoundSelected(userId);
};

export const startRound = async (gameId, roundId) => {
    const service = new NaguiRoundService(gameId, roundId);
    return service.startRound();
};

export const handleQuestionEnd = async (gameId, roundId) => {
    const service = new NaguiRoundService(gameId, roundId);
    return service.handleQuestionEnd();
};

export const endRound = async (gameId, roundId) => {
    const service = new NaguiRoundService(gameId, roundId);
    return service.endRound();
};

/* ============================================================================================================ */
