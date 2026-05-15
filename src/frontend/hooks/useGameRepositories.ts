import { useContext, useMemo } from 'react';

import createGameRepositories, { type GameRepositories } from '@/backend/repositories/createGameRepositories';
import { GameRepositoriesContext } from '@/frontend/contexts/GameRepositoriesContext';

const useGameRepositories = (gameId?: string): GameRepositories | null => {
  const contextRepositories = useContext(GameRepositoriesContext);

  const createdRepositories = useMemo(() => {
    if (gameId) {
      return createGameRepositories(gameId);
    }
    return null;
  }, [gameId]);

  return createdRepositories ?? contextRepositories;
};

export default useGameRepositories;
