import { doc } from 'firebase/firestore';

import { firestore } from '@/firebase/firebase';
import { useFirestoreDocument } from '@/frontend/hooks/firestore/useFirestoreDocument';

export function useReady(gameId: string | null) {
  const { data, isLoading, error } = useFirestoreDocument(
    gameId ? doc(firestore, 'games', gameId, 'realtime', 'ready') : null
  );
  return { ready: data, readyLoading: isLoading, readyError: error };
}
