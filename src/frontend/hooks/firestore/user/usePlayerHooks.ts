import { query, where } from 'firebase/firestore';

import type PlayerRepository from '@/backend/repositories/user/PlayerRepository';
import { useFirestoreCollection, useFirestoreCollectionOnce } from '@/frontend/hooks/firestore/useFirestoreCollection';
import { useFirestoreDocument, useFirestoreDocumentOnce } from '@/frontend/hooks/firestore/useFirestoreDocument';
import { Player, type PlayerData } from '@/models/users/player';

export function usePlayer(repo: PlayerRepository | null, playerId: string) {
  const { data, isLoading, error } = useFirestoreDocument(repo ? repo.getDocumentRef(playerId) : null);
  return { player: data ? new Player(data as unknown as PlayerData) : null, loading: isLoading, error };
}

export function usePlayerOnce(repo: PlayerRepository | null, playerId: string) {
  const { data, isLoading, error } = useFirestoreDocumentOnce(repo ? repo.getDocumentRef(playerId) : null);
  return { player: data ? new Player(data as unknown as PlayerData) : null, loading: isLoading, error };
}

export function usePlayerIdentityOnce(repo: PlayerRepository | null, playerId: string) {
  const { data, isLoading, error } = useFirestoreDocumentOnce(repo ? repo.getDocumentRef(playerId) : null);
  return {
    player: data ? { id: data.id, name: data.name, teamId: data.teamId } : null,
    loading: isLoading,
    error,
  };
}

export function useAllPlayerIdentitiesOnce(repo: PlayerRepository | null) {
  const { data, isLoading, error } = useFirestoreCollectionOnce(repo ? query(repo.collectionRef) : null, [
    repo?.collectionRef.path ?? null,
  ]);
  return {
    players: data?.map((p) => ({ id: p.id as string, name: p.name as string, teamId: p.teamId as string })) ?? [],
    loading: isLoading,
    error,
  };
}

export function usePlayerStates(repo: PlayerRepository | null) {
  const { data, isLoading, error } = useFirestoreCollection(repo ? query(repo.collectionRef) : null, [
    repo?.collectionRef.path ?? null,
  ]);
  return { playerStates: data?.map((p) => ({ id: p.id, status: p.status })) ?? [], loading: isLoading, error };
}

export function useAllPlayers(repo: PlayerRepository | null) {
  const { data, isLoading, error } = useFirestoreCollection(repo ? query(repo.collectionRef) : null, [
    repo?.collectionRef.path ?? null,
  ]);
  return { players: data?.map((p) => new Player(p as unknown as PlayerData)) ?? [], loading: isLoading, error };
}

export function useAllPlayersOnce(repo: PlayerRepository | null) {
  const { data, isLoading, error } = useFirestoreCollectionOnce(repo ? query(repo.collectionRef) : null, [
    repo?.collectionRef.path ?? null,
  ]);
  return { players: data?.map((p) => new Player(p as unknown as PlayerData)) ?? [], loading: isLoading, error };
}

export function useTeamPlayers(repo: PlayerRepository | null, teamId: string) {
  const { data, isLoading, error } = useFirestoreCollection(
    repo ? query(repo.collectionRef, where('teamId', '==', teamId)) : null,
    [repo?.collectionRef.path ?? null, 'teamId', teamId]
  );
  return { players: data?.map((p) => new Player(p as unknown as PlayerData)) ?? [], loading: isLoading, error };
}

export function usePlayersByStatus(repo: PlayerRepository | null, status: string) {
  const { data, isLoading, error } = useFirestoreCollection(
    repo ? query(repo.collectionRef, where('status', '==', status)) : null,
    [repo?.collectionRef.path ?? null, 'status', status]
  );
  return { players: data?.map((p) => new Player(p as unknown as PlayerData)) ?? [], loading: isLoading, error };
}
