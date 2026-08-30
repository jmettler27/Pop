import { doc } from 'firebase/firestore';

import { firestore } from '@/firebase/client';
import { useFirestoreDocument } from '@/hooks/firestore/useFirestoreDocument';
import { type Timer } from '@/models/timer';

export function useTimer(gameId: string | null) {
  const { data, isLoading, error } = useFirestoreDocument(
    gameId ? doc(firestore, 'games', gameId, 'realtime', 'timer') : null
  );
  return { timer: data ? (data as unknown as Timer) : null, timerLoading: isLoading, timerError: error };
}
