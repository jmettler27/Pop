'use server';

import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

import { logger } from '@/backend/logger';
import { ensureBackendAuth } from '@/firebase/backend-auth';
import { GAMES_COLLECTION_REF } from '@/firebase/firestore';

const log = logger.child({ module: 'sounds' });

export async function addSound(gameId: string, filename: string) {
  await ensureBackendAuth();
  const queueCollectionRef = collection(GAMES_COLLECTION_REF, gameId, 'realtime', 'sounds', 'queue');
  await addDoc(queueCollectionRef, {
    timestamp: serverTimestamp(),
    filename: filename,
  });
  log.info({ game: gameId, filename }, 'Sound added to queue');
}
