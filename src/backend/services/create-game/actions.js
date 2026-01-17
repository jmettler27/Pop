"use server";

import CreateGameService from '@/backend/services/create-game/CreateGameService';

export const createGame = async (data) => {
    const service = new CreateGameService();
    return await service.createGame(data);
}
