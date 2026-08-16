import { collection, doc, query, where } from 'firebase/firestore';

import { firestore } from '@/backend/firebase/firebase';
import { useFirestoreCollection } from '@/frontend/hooks/firestore/useFirestoreCollection';
import { useFirestoreDocument, useFirestoreDocumentOnce } from '@/frontend/hooks/firestore/useFirestoreDocument';
import { type GameType } from '@/models/games/game-type';
import GameFactory from '@/models/games/GameFactory';

const GAMES_REF = collection(firestore, 'games');

export function useGame(id: string) {
  const { data, isLoading, error } = useFirestoreDocument(doc(GAMES_REF, id));
  return { game: data ? GameFactory.createGame(data.type as GameType, data) : null, loading: isLoading, error };
}

export function useGameOnce(id: string) {
  const { data, isLoading, error } = useFirestoreDocumentOnce(doc(GAMES_REF, id));
  return { game: data ? GameFactory.createGame(data.type as GameType, data) : null, loading: isLoading, error };
}

export function useGamesByStatus(status: string) {
  const { data, isLoading, error } = useFirestoreCollection(query(GAMES_REF, where('status', '==', status)), [
    'games',
    'status',
    status,
  ]);
  return { games: data?.map((g) => GameFactory.createGame(g.type as GameType, g)) ?? [], loading: isLoading, error };
}
