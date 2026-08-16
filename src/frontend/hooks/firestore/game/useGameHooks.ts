import { query, where } from 'firebase/firestore';

import type GameRepository from '@/backend/repositories/game/GameRepository';
import { useFirestoreCollection } from '@/frontend/hooks/firestore/useFirestoreCollection';
import { useFirestoreDocument, useFirestoreDocumentOnce } from '@/frontend/hooks/firestore/useFirestoreDocument';
import { type GameType } from '@/models/games/game-type';
import GameFactory from '@/models/games/GameFactory';

export function useGame(repo: GameRepository | null, id: string) {
  const { data, isLoading, error } = useFirestoreDocument(repo ? repo.getDocumentRef(id) : null);
  return { game: data ? GameFactory.createGame(data.type as GameType, data) : null, loading: isLoading, error };
}

export function useGameOnce(repo: GameRepository | null, id: string) {
  const { data, isLoading, error } = useFirestoreDocumentOnce(repo ? repo.getDocumentRef(id) : null);
  return { game: data ? GameFactory.createGame(data.type as GameType, data) : null, loading: isLoading, error };
}

export function useGamesByStatus(repo: GameRepository | null, status: string) {
  const { data, isLoading, error } = useFirestoreCollection(
    repo ? query(repo.collectionRef, where('status', '==', status)) : null,
    [repo?.collectionRef.path ?? null, 'status', status]
  );
  return { games: data?.map((g) => GameFactory.createGame(g.type as GameType, g)) ?? [], loading: isLoading, error };
}
