import { useContext } from 'react';

import { UserContext } from '@/frontend/contexts/UserContext';

const useUser = () => {
  const user = useContext(UserContext);

  return user;
};

export default useUser;
