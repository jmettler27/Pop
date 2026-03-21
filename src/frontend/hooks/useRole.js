import { useContext } from 'react';

import { RoleContext } from '@/frontend/contexts/RoleContext';

const useRole = () => {
  const role = useContext(RoleContext);

  return role;
};

export default useRole;
