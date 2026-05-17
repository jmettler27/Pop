import { useContext } from 'react';

import { GameContext } from '@/frontend/contexts/GameContext';
import { type GameRandom, type GameRounds } from '@/models/games/game';

const useGame = (): GameRounds | null => {
  return useContext(GameContext);
};

export default useGame;
