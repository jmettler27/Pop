'use server';

import JoinGameService from '@/backend/services/join-game/JoinGameService';

export const joinGame = async (gameId: string, userId: string, data: any) => {
  const service = new JoinGameService(gameId);
  return service.joinGame(userId, data);
};
