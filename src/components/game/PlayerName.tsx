import { useEffect, useState } from 'react';

import { doc, DocumentData, getDoc } from 'firebase/firestore';

import { GAMES_COLLECTION_REF } from '@/firebase/firestore';
import { usePlayerOnce } from '@/hooks/firestore/user/usePlayerHooks';
import { useTeamOnce } from '@/hooks/firestore/user/useTeamHooks';
import useGameId from '@/hooks/useGameId';
import useRole from '@/hooks/useRole';
import { ParticipantRole } from '@/models/users/participant';

interface PlayerNameProps {
  playerId: string;
  teamColor?: boolean;
}

export default function PlayerName({ playerId, teamColor = true }: PlayerNameProps) {
  const gameId = useGameId();

  const role = useRole();

  const { player, loading: playerLoading, error: playerError } = usePlayerOnce(gameId, playerId);

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
  }, [player, gameId, teamColor]);

  if (playerError) {
    return <></>;
  }
  if (playerLoading || (teamColor && teamLoading)) {
    return role === ParticipantRole.ORGANIZER && <span>Loading player info...</span>;
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
  const gameId = useGameId();
  const role = useRole();

  const { player, loading: playerLoading, error: playerError } = usePlayerOnce(gameId, playerId);
  const { team, loading: teamLoading, error: teamError } = useTeamOnce(gameId, teamId);

  if (playerError || teamError) {
    return <></>;
  }
  if (playerLoading || teamLoading) {
    return role === ParticipantRole.ORGANIZER && <span>Loading player info...</span>;
  }
  if (!player) {
    return <span>Player not found</span>;
  }

  return <span style={{ color: team?.color }}>{player.name}</span>;
}
