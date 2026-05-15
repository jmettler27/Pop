import React, { createContext } from 'react';

export const TeamContext = createContext<string | null>(null);

interface TeamProviderProps {
  children: React.ReactNode;
  teamId: string | null;
}

export const TeamProvider = ({ children, teamId }: TeamProviderProps) => {
  return <TeamContext.Provider value={teamId}>{children}</TeamContext.Provider>;
};
