import { useContext, useMemo } from 'react';

import createGameRepositories from '@/backend/repositories/createGameRepositories';
import { GameRepositoriesContext } from '@/frontend/contexts/GameRepositoriesContext';

/**
 * Returns game repositories from context (when inside a GameRepositoriesProvider),
 * or creates them on the fly when a gameId is provided.
 */
const useGameRepositories = (gameId) => {
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
