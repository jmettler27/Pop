import React, { createContext } from 'react';

import { type ParticipantRole } from '@/models/users/participant';

export const RoleContext = createContext<ParticipantRole | null>(null);

interface RoleProviderProps {
  children: React.ReactNode;
  role: ParticipantRole | null;
}

export const RoleProvider = ({ children, role }: RoleProviderProps) => {
  return <RoleContext.Provider value={role}>{children}</RoleContext.Provider>;
};
