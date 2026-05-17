import { useContext } from 'react';

import { TeamContext } from '@/frontend/contexts/TeamContext';

const useTeam = (): string | null => {
  return useContext(TeamContext);
};

export default useTeam;
