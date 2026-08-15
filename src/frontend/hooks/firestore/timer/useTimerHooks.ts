import { doc } from 'firebase/firestore';

import { firestore } from '@/backend/firebase/firebase';
import { useFirestoreDocument, useFirestoreDocumentOnce } from '@/frontend/hooks/firestore/useFirestoreDocument';
import { type Timer } from '@/models/timer';

export function useTimer(gameId: string | null) {
  const { data, isLoading, error } = useFirestoreDocument(
    gameId ? doc(firestore, 'games', gameId, 'realtime', 'timer') : null
  );
  return { timer: data ? (data as unknown as Timer) : null, timerLoading: isLoading, timerError: error };
}

export function useTimerOnce(gameId: string | null) {
  const { data, isLoading, error } = useFirestoreDocumentOnce(
    gameId ? doc(firestore, 'games', gameId, 'realtime', 'timer') : null
  );
  return { timer: data ? (data as unknown as Timer) : null, timerLoading: isLoading, timerError: error };
}
