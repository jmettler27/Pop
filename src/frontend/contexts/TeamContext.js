import React, { createContext } from 'react';

export const TeamContext = createContext(null);

export const TeamProvider = ({ children, teamId }) => {
  return <TeamContext.Provider value={teamId}>{children}</TeamContext.Provider>;
};
