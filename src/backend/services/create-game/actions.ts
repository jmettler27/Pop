'use server';

import CreateGameService from '@/backend/services/create-game/CreateGameService';
import { CreateGameRoundsData } from '@/models/games/game';

export const createGame = async (data: CreateGameRoundsData) => {
  const service = new CreateGameService();
  return await service.createGame(data);
};
