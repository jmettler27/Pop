import { useMemo } from 'react';

import { collection, doc, query, where } from 'firebase/firestore';

import { firestore } from '@/firebase/client';
import { useFirestoreCollection, useFirestoreCollectionOnce } from '@/hooks/firestore/useFirestoreCollection';
import { useFirestoreDocument, useFirestoreDocumentOnce } from '@/hooks/firestore/useFirestoreDocument';
import { Player, type PlayerData } from '@/models/users/player';

function playersRef(gameId: string) {
  return collection(firestore, 'games', gameId, 'players');
}

export function usePlayer(gameId: string | null, playerId: string) {
  const { data, isLoading, error } = useFirestoreDocument(gameId ? doc(playersRef(gameId), playerId) : null);
  return { player: data ? new Player(data as unknown as PlayerData) : null, loading: isLoading, error };
}

export function usePlayerOnce(gameId: string | null, playerId: string) {
  const { data, isLoading, error } = useFirestoreDocumentOnce(gameId ? doc(playersRef(gameId), playerId) : null);
  return { player: data ? new Player(data as unknown as PlayerData) : null, loading: isLoading, error };
}

// Every hook below is memoized on `data` so the returned array/instances stay referentially stable
// across renders when the underlying data hasn't changed — an unmemoized `.map()` mints brand-new
// objects on every render even when nothing changed, which is wasteful and can destabilize anything
// downstream that's sensitive to prop/ref identity.

export function useAllPlayerIdentitiesOnce(gameId: string | null) {
  const { data, isLoading, error } = useFirestoreCollectionOnce(gameId ? query(playersRef(gameId)) : null, [
    gameId,
    'players',
  ]);
  const players = useMemo(
    () => data?.map((p) => ({ id: p.id as string, name: p.name as string, teamId: p.teamId as string })) ?? [],
    [data]
  );
  return { players, loading: isLoading, error };
}

export function useAllPlayers(gameId: string | null) {
  const { data, isLoading, error } = useFirestoreCollection(gameId ? query(playersRef(gameId)) : null, [
    gameId,
    'players',
  ]);
  const players = useMemo(() => data?.map((p) => new Player(p as unknown as PlayerData)) ?? [], [data]);
  return { players, loading: isLoading, error };
}

export function useAllPlayersOnce(gameId: string | null) {
  const { data, isLoading, error } = useFirestoreCollectionOnce(gameId ? query(playersRef(gameId)) : null, [
    gameId,
    'players',
  ]);
  const players = useMemo(() => data?.map((p) => new Player(p as unknown as PlayerData)) ?? [], [data]);
  return { players, loading: isLoading, error };
}

export function useTeamPlayers(gameId: string | null, teamId: string) {
  const { data, isLoading, error } = useFirestoreCollection(
    gameId ? query(playersRef(gameId), where('teamId', '==', teamId)) : null,
    [gameId, 'players', 'teamId', teamId]
  );
  const players = useMemo(() => data?.map((p) => new Player(p as unknown as PlayerData)) ?? [], [data]);
  return { players, loading: isLoading, error };
}
