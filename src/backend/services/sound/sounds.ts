'use server';

import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

import { GAMES_COLLECTION_REF } from '@/backend/firebase/firestore';
import { logger } from '@/backend/logger';

const log = logger.child({ module: 'sounds' });

export async function addSound(gameId: string, filename: string) {
  const queueCollectionRef = collection(GAMES_COLLECTION_REF, gameId, 'realtime', 'sounds', 'queue');
  await addDoc(queueCollectionRef, {
    timestamp: serverTimestamp(),
    filename: filename,
  });
  log.info({ game: gameId, filename }, 'Sound added to queue');
}
