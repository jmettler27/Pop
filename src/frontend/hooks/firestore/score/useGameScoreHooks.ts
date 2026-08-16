import { doc } from 'firebase/firestore';

import { firestore } from '@/backend/firebase/firebase';
import { useFirestoreDocument, useFirestoreDocumentOnce } from '@/frontend/hooks/firestore/useFirestoreDocument';

export function useScores(gameId: string | null) {
  const { data, isLoading, error } = useFirestoreDocument(
    gameId ? doc(firestore, 'games', gameId, 'realtime', 'scores') : null
  );
  return { gameScores: data, loading: isLoading, error };
}

export function useScoresOnce(gameId: string | null) {
  const { data, isLoading, error } = useFirestoreDocumentOnce(
    gameId ? doc(firestore, 'games', gameId, 'realtime', 'scores') : null
  );
  return { gameScores: data, loading: isLoading, error };
}
