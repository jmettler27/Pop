import { doc } from 'firebase/firestore';

import { firestore } from '@/firebase/firebase';
import { useFirestoreDocument, useFirestoreDocumentOnce } from '@/frontend/hooks/firestore/useFirestoreDocument';

export function useScores(gameId: string | null, roundId: string | null) {
  const { data, isLoading, error } = useFirestoreDocument(
    gameId && roundId ? doc(firestore, 'games', gameId, 'rounds', roundId, 'realtime', 'scores') : null
  );
  return { roundScores: data, loading: isLoading, error };
}

export function useScoresOnce(gameId: string | null, roundId: string | null) {
  const { data, isLoading, error } = useFirestoreDocumentOnce(
    gameId && roundId ? doc(firestore, 'games', gameId, 'rounds', roundId, 'realtime', 'scores') : null
  );
  return { roundScores: data, loading: isLoading, error };
}
