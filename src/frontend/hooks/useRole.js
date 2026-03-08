import { RoleContext } from '@/frontend/contexts/RoleContext';
import { useContext } from 'react';

const useRole = () => {
  const role = useContext(RoleContext);

  return role;
};

export default useRole;
