import { collection, doc, query, where } from 'firebase/firestore';

import { firestore } from '@/backend/firebase/firebase';
import { useFirestoreCollection, useFirestoreCollectionOnce } from '@/frontend/hooks/firestore/useFirestoreCollection';
import { useFirestoreDocument, useFirestoreDocumentOnce } from '@/frontend/hooks/firestore/useFirestoreDocument';
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

export function usePlayerIdentityOnce(gameId: string | null, playerId: string) {
  const { data, isLoading, error } = useFirestoreDocumentOnce(gameId ? doc(playersRef(gameId), playerId) : null);
  return {
    player: data ? { id: data.id, name: data.name, teamId: data.teamId } : null,
    loading: isLoading,
    error,
  };
}

export function useAllPlayerIdentitiesOnce(gameId: string | null) {
  const { data, isLoading, error } = useFirestoreCollectionOnce(gameId ? query(playersRef(gameId)) : null, [
    gameId,
    'players',
  ]);
  return {
    players: data?.map((p) => ({ id: p.id as string, name: p.name as string, teamId: p.teamId as string })) ?? [],
    loading: isLoading,
    error,
  };
}

export function usePlayerStates(gameId: string | null) {
  const { data, isLoading, error } = useFirestoreCollection(gameId ? query(playersRef(gameId)) : null, [
    gameId,
    'players',
  ]);
  return { playerStates: data?.map((p) => ({ id: p.id, status: p.status })) ?? [], loading: isLoading, error };
}

export function useAllPlayers(gameId: string | null) {
  const { data, isLoading, error } = useFirestoreCollection(gameId ? query(playersRef(gameId)) : null, [
    gameId,
    'players',
  ]);
  return { players: data?.map((p) => new Player(p as unknown as PlayerData)) ?? [], loading: isLoading, error };
}

export function useAllPlayersOnce(gameId: string | null) {
  const { data, isLoading, error } = useFirestoreCollectionOnce(gameId ? query(playersRef(gameId)) : null, [
    gameId,
    'players',
  ]);
  return { players: data?.map((p) => new Player(p as unknown as PlayerData)) ?? [], loading: isLoading, error };
}

export function useTeamPlayers(gameId: string | null, teamId: string) {
  const { data, isLoading, error } = useFirestoreCollection(
    gameId ? query(playersRef(gameId), where('teamId', '==', teamId)) : null,
    [gameId, 'players', 'teamId', teamId]
  );
  return { players: data?.map((p) => new Player(p as unknown as PlayerData)) ?? [], loading: isLoading, error };
}

export function usePlayersByStatus(gameId: string | null, status: string) {
  const { data, isLoading, error } = useFirestoreCollection(
    gameId ? query(playersRef(gameId), where('status', '==', status)) : null,
    [gameId, 'players', 'status', status]
  );
  return { players: data?.map((p) => new Player(p as unknown as PlayerData)) ?? [], loading: isLoading, error };
}
