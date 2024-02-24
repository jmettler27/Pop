import { useContext, createContext } from 'react';


export const UserContext = createContext(null);
export const useUserContext = () => useContext(UserContext);
