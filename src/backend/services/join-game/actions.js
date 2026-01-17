'use server';

import JoinGameService from '@/backend/services/join-game/JoinGameService';

export const joinGame = async (gameId, userId, data) => {
  const service = new JoinGameService(gameId);
  return service.joinGame(gameId, userId, data);
};
