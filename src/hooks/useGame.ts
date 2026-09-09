import { useContext } from 'react';

import { GameContext } from '@/contexts/GameContext';
import { type GameRounds } from '@/models/games/game';

const useGame = (): GameRounds | null => {
  return useContext(GameContext);
};

export default useGame;
