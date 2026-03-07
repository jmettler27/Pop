import React, { createContext } from 'react';

export const GameContext = createContext(null);

export const GameProvider = ({ children, game }) => {
  return <GameContext.Provider value={game}>{children}</GameContext.Provider>;
};
