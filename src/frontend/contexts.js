import { useContext, createContext } from 'react';

export const UserContext = createContext(null);
export const useUserContext = () => useContext(UserContext);

export const GameContext = createContext(null);
export const useGameContext = () => useContext(GameContext);

export const TeamContext = createContext(null);
export const useTeamContext = () => useContext(TeamContext);

export const RoleContext = createContext(null);
export const useRoleContext = () => useContext(RoleContext);

export const GameRepositoriesContext = createContext(null);
export const useGameRepositoriesContext = () => useContext(GameRepositoriesContext);