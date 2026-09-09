import { useQuery } from '@tanstack/react-query';

import { listGames, type GameResponse } from '@/api';
import { isoToFirestoreTimestamp } from '@/helpers/time';
import useUserId from '@/hooks/useUserId';
import { type GameRoundsData } from '@/models/games/game';

/** Go `GameResponse` → the serializable game summary the home-page cards render. */
const toGameSummary = (game: GameResponse): GameRoundsData => ({
  id: game.id,
  title: game.title,
  type: game.type,
  lang: game.lang,
  status: game.status,
  dateEnd: isoToFirestoreTimestamp(game.dateEnd),
});

/**
 * Games the signed-in user organises or plays, filtered by lifecycle status, newest first.
 * From the Go backend (`GET /games?status=`) — it resolves the caller from the token and
 * runs the member filter server-side. The card children still read `games/{id}` live for
 * the organizer / player avatars.
 */
function useGamesByStatus(status: 'ended' | 'edit') {
  const userId = useUserId();
  const { data, isLoading, error } = useQuery({
    queryKey: ['games', status, userId],
    queryFn: () => listGames(status),
    enabled: !!userId,
  });
  return { games: data?.map(toGameSummary), loading: isLoading, error };
}

export const useEndedGames = () => useGamesByStatus('ended');

export const useGamesUnderConstruction = () => useGamesByStatus('edit');
