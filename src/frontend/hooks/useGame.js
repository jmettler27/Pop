import { useContext } from 'react';

import { GameContext } from '@/frontend/contexts/GameContext';

const useGame = () => {
  const game = useContext(GameContext);

  return game;
};

export default useGame;
