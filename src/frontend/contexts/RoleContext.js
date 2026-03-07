import React, { createContext } from 'react';

export const RoleContext = createContext(null);

export const RoleProvider = ({ children, role }) => {
  return <RoleContext.Provider value={role}>{children}</RoleContext.Provider>;
};
