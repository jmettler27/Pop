import { collection, doc } from 'firebase/firestore';

import { firestore } from '@/backend/firebase/firebase';
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
