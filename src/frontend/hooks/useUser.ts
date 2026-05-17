import { useContext } from 'react';

import { UserContext } from '@/frontend/contexts/UserContext';
import User from '@/models/users/user';

const useUser = (): User | null => {
  return useContext(UserContext);
};

export default useUser;
