import { useContext } from 'react';

import { RoleContext } from '@/frontend/contexts/RoleContext';
import { type ParticipantRole } from '@/models/users/participant';

const useRole = (): ParticipantRole | null => {
  return useContext(RoleContext);
};

export default useRole;
