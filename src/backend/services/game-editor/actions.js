"use server";

import GameEditorService from '@/backend/services/game-editor/GameEditorService';

export const addRoundToGame = async (gameId, roundTitle, roundType) => {
    const service = new GameEditorService(gameId);
    return service.addRoundToGame(roundTitle, roundType);
};

export const removeRoundFromGame = async (gameId, roundId) => {
    const service = new GameEditorService(gameId);
    return service.removeRoundFromGame(roundId);
};

export const addQuestionToRound = async (gameId, roundId, questionId, managerId) => {
    const service = new GameEditorService(gameId);
    return service.addQuestionToRound(roundId, questionId, managerId);
};

export const removeQuestionFromRound = async (gameId, roundId, questionId) => {
    const service = new GameEditorService(gameId);
    return service.removeQuestionFromRound(roundId, questionId);
};

export const addOrganizerToGame = async (gameId, organizerId) => {
    const service = new GameEditorService(gameId);
    return service.addOrganizerToGame(organizerId);
};

export const launchGame = async (gameId) => {
    const service = new GameEditorService(gameId);
    return service.launchGame();
}; 