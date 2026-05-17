import React, { createContext } from 'react';

import { type GameRepositories } from '@/backend/repositories/createGameRepositories';

export const GameRepositoriesContext = createContext<GameRepositories | null>(null);

interface GameRepositoriesProviderProps {
  children: React.ReactNode;
  repositories: GameRepositories | null;
}

export const GameRepositoriesProvider = ({ children, repositories }: GameRepositoriesProviderProps) => {
  return <GameRepositoriesContext.Provider value={repositories}>{children}</GameRepositoriesContext.Provider>;
};
