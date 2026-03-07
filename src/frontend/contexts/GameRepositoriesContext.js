import React, { createContext } from 'react';

export const GameRepositoriesContext = createContext(null);

export const GameRepositoriesProvider = ({ children, repositories }) => {
  return <GameRepositoriesContext.Provider value={repositories}>{children}</GameRepositoriesContext.Provider>;
};
