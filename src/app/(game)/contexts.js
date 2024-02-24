import { useContext, createContext } from 'react';

export const GameContext = createContext(null);
export const TeamContext = createContext(null);
export const RoleContext = createContext(null);

export const useGameContext = () => useContext(GameContext);
export const useTeamContext = () => useContext(TeamContext);
export const useRoleContext = () => useContext(RoleContext);