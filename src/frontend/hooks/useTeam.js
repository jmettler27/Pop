import { TeamContext } from '@/frontend/contexts/TeamContext';
import { useContext } from 'react';

const useTeam = () => {
  const team = useContext(TeamContext);

  return team;
};

export default useTeam;
