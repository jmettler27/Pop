import React, { createContext } from 'react';

import User from '@/models/users/user';

export const UserContext = createContext<User | null>(null);

interface UserProviderProps {
  children: React.ReactNode;
  user: User | null;
}

export const UserProvider = ({ children, user }: UserProviderProps) => {
  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
};
