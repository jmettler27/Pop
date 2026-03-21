'use server';

import { GAMES_COLLECTION_REF } from '@/backend/firebase/firestore';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export async function addSound(gameId, filename) {
  const queueCollectionRef = collection(GAMES_COLLECTION_REF, gameId, 'realtime', 'sounds', 'queue');
  await addDoc(queueCollectionRef, {
    timestamp: serverTimestamp(),
    filename: filename,
  });
  console.log(`Game ${gameId} Sound ${filename} added to queue`);
}
