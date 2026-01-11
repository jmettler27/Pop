"use server";

import EmojiRoundService from "@/backend/services/round/emoji/EmojiRoundService";


export const handleRoundSelected = async (gameId, roundId, userId) => {
    const service = new EmojiRoundService(gameId, roundId);
    return service.handleRoundSelected(userId);
};

export const startRound = async (gameId, roundId) => {
    const service = new EmojiRoundService(gameId, roundId);
    return service.startRound();
};

export const handleQuestionEnd = async (gameId, roundId) => {
    const service = new EmojiRoundService(gameId, roundId);
    return service.handleQuestionEnd();
};

export const endRound = async (gameId, roundId) => {
    const service = new EmojiRoundService(gameId, roundId);
    return service.endRound();
};

/* ============================================================================================================ */
