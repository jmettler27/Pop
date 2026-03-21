import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

import { doc, getDoc } from 'firebase/firestore';

import { GAMES_COLLECTION_REF } from '@/backend/firebase/firestore';
import { ParticipantRole } from '@/backend/models/users/Participant';
import useGameRepositories from '@/frontend/hooks/useGameRepositories';
import useRole from '@/frontend/hooks/useRole';

export default function PlayerName({ playerId, teamColor = true }) {
  const { id: gameId } = useParams();

  const myRole = useRole();

  const { playerRepo } = useGameRepositories();
  const { player, loading: playerLoading, error: playerError } = playerRepo.usePlayerOnce(playerId);

  const [team, setTeam] = useState(null);
  const [teamLoading, setTeamLoading] = useState(true);
  const [teamError, setTeamError] = useState(null);

  useEffect(() => {
    if (player && player.teamId && teamColor) {
      getDoc(doc(GAMES_COLLECTION_REF, gameId, 'teams', player.teamId))
        .then((teamSnapshot) => {
          if (teamSnapshot.exists()) {
            setTeam(teamSnapshot.data());
          } else {
            setTeamError('Team not found');
          }
        })
        .catch((error) => {
          setTeamError(error.message);
        })
        .finally(() => {
          setTeamLoading(false);
        });
    }
  }, [player]);

  if (playerError) {
    return <></>;
  }
  if (playerLoading || (teamColor && teamLoading)) {
    return myRole === ParticipantRole.ORGANIZER && <span>Loading player info...</span>;
  }
  if (!player) {
    return <span>Player not found</span>;
  }
  if (teamColor && teamError) {
    return <></>;
  }

  return <span style={{ color: team?.color }}>{player.name}</span>;
}

export function WinnerName({ playerId, teamId }) {
  console.log('WinnerName - playerId:', playerId, 'teamId:', teamId);
  const myRole = useRole();

  const { playerRepo, teamRepo } = useGameRepositories();
  const { player, loading: playerLoading, error: playerError } = playerRepo.usePlayerOnce(playerId);
  const { team, loading: teamLoading, error: teamError } = teamRepo.useTeamOnce(teamId);

  if (playerError || teamError) {
    return <></>;
  }
  if (playerLoading || teamLoading) {
    return myRole === ParticipantRole.ORGANIZER && <span>Loading player info...</span>;
  }
  if (!player) {
    return <span>Player not found</span>;
  }

  return <span style={{ color: team?.color }}>{player.name}</span>;
}
