import React, { createContext } from 'react';

import { type GameRandom, type GameRounds } from '@/models/games/game';

export const GameContext = createContext<GameRounds | null>(null);

interface GameProviderProps {
  children: React.ReactNode;
  game: GameRounds;
}

export const GameProvider = ({ children, game }: GameProviderProps) => {
  return <GameContext.Provider value={game}>{children}</GameContext.Provider>;
};
