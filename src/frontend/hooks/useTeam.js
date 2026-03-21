import { useContext } from 'react';

import { TeamContext } from '@/frontend/contexts/TeamContext';

const useTeam = () => {
  const team = useContext(TeamContext);

  return team;
};

export default useTeam;
