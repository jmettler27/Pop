'use server';

import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

import { GAMES_COLLECTION_REF } from '@/backend/firebase/firestore';

export async function addSound(gameId: string, filename: string) {
  const queueCollectionRef = collection(GAMES_COLLECTION_REF, gameId, 'realtime', 'sounds', 'queue');
  await addDoc(queueCollectionRef, {
    timestamp: serverTimestamp(),
    filename: filename,
  });
  console.log(`Game ${gameId} Sound ${filename} added to queue`);
}
