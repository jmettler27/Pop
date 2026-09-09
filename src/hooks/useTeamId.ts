import { useContext } from 'react';

import { TeamContext } from '@/contexts/TeamContext';

const useTeamId = (): string | null => {
  return useContext(TeamContext);
};

export default useTeamId;
