"use server";

import GameCreatorService from '@/backend/services/game-creator/GameCreatorService';

export const createGame = async (data) => {
    const service = new GameCreatorService();
    return await service.createGame(data);
}
