'use server';

import PlayerService from '@/backend/services/player/PlayerService';

export const setPlayerReady = async (gameId: string, playerId: string) => {
  const service = new PlayerService(gameId);
  return service.setPlayerReady(playerId);
};

export const togglePlayerAuthorization = async (gameId: string, authorized: boolean | null = null) => {
  const service = new PlayerService(gameId);
  return service.togglePlayerAuthorization(authorized);
};
