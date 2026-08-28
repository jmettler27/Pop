'use server';

import { FieldValue } from 'firebase-admin/firestore';

import { logger } from '@/backend/logger';
import { adminDb } from '@/firebase/admin';

const log = logger.child({ module: 'sounds' });

export async function addSound(gameId: string, filename: string) {
  const queueCollectionRef = adminDb().collection(`games/${gameId}/realtime/sounds/queue`);
  await queueCollectionRef.add({
    timestamp: FieldValue.serverTimestamp(),
    filename: filename,
  });
  log.info({ game: gameId, filename }, 'Sound added to queue');
}
