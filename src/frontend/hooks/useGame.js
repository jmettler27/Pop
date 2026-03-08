import { GameContext } from '@/frontend/contexts/GameContext';
import { useContext } from 'react';

const useGame = () => {
  const game = useContext(GameContext);

  return game;
};

export default useGame;
