import { useMemo } from 'react';

import { collection, doc } from 'firebase/firestore';

import { firestore } from '@/firebase/firebase';
import { useFirestoreDocument, useFirestoreDocumentOnce } from '@/frontend/hooks/firestore/useFirestoreDocument';
import { type GameType } from '@/models/games/game-type';
import GameFactory from '@/models/games/GameFactory';

const GAMES_REF = collection(firestore, 'games');

// Memoized on `data` so `game` stays referentially stable across renders when the underlying document
// hasn't changed — this feeds GameContext's value, and an unstable reference here re-renders every
// consumer of that context on every render of the page, not just on real game-document changes.
export function useGame(id: string) {
  const { data, isLoading, error } = useFirestoreDocument(doc(GAMES_REF, id));
  const game = useMemo(() => (data ? GameFactory.createGame(data.type as GameType, data) : null), [data]);
  return { game, loading: isLoading, error };
}

export function useGameOnce(id: string) {
  const { data, isLoading, error } = useFirestoreDocumentOnce(doc(GAMES_REF, id));
  const game = useMemo(() => (data ? GameFactory.createGame(data.type as GameType, data) : null), [data]);
  return { game, loading: isLoading, error };
}
