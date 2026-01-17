'use server';

import PlayerService from '@/backend/services/player/PlayerService';

export const setPlayerReady = async (gameId, playerId) => {
  const service = new PlayerService(gameId);
  return service.setPlayerReady(playerId);
};

export const togglePlayerAuthorization = async (gameId, authorized = null) => {
  const service = new PlayerService(gameId);
  return service.togglePlayerAuthorization(authorized);
};
