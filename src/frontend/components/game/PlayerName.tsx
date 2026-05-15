import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

import { doc, DocumentData, getDoc } from 'firebase/firestore';

import { GAMES_COLLECTION_REF } from '@/backend/firebase/firestore';
import useGameRepositories from '@/frontend/hooks/useGameRepositories';
import useRole from '@/frontend/hooks/useRole';
import { ParticipantRole } from '@/models/users/participant';

interface PlayerNameProps {
  playerId: string;
  teamColor?: boolean;
}

export default function PlayerName({ playerId, teamColor = true }: PlayerNameProps) {
  const { id } = useParams();
  const gameId = id as string;

  const myRole = useRole();

  const repos = useGameRepositories();
  const {
    player,
    loading: playerLoading,
    error: playerError,
  } = repos?.playerRepo.usePlayerOnce(playerId) ?? { player: null, loading: true, error: undefined };

  const [team, setTeam] = useState<DocumentData | null>(null);
  const [teamLoading, setTeamLoading] = useState(true);
  const [teamError, setTeamError] = useState<string | null>(null);

  useEffect(() => {
    if (player && player.teamId && teamColor) {
      getDoc(doc(GAMES_COLLECTION_REF, gameId as string, 'teams', player.teamId))
        .then((teamSnapshot) => {
          if (teamSnapshot.exists()) {
            setTeam(teamSnapshot.data());
          } else {
            setTeamError('Team not found');
          }
        })
        .catch((error: Error) => {
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

interface WinnerNameProps {
  playerId: string;
  teamId: string;
}

export function WinnerName({ playerId, teamId }: WinnerNameProps) {
  console.log('WinnerName - playerId:', playerId, 'teamId:', teamId);
  const myRole = useRole();

  const repos = useGameRepositories();
  const {
    player,
    loading: playerLoading,
    error: playerError,
  } = repos?.playerRepo.usePlayerOnce(playerId) ?? { player: null, loading: true, error: undefined };
  const {
    team,
    loading: teamLoading,
    error: teamError,
  } = repos?.teamRepo.useTeamOnce(teamId) ?? { team: null, loading: true, error: undefined };

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
