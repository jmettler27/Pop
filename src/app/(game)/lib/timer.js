"use server";

import { GAMES_COLLECTION_REF } from '@/lib/firebase/firestore';
import { db } from '@/lib/firebase/firebase'
import {
    collection,
    doc,
    serverTimestamp,
    updateDoc,
    writeBatch,
} from 'firebase/firestore'

import { addSoundToQueue } from '@/app/(game)/lib/sounds';

export async function updateTimerState(gameId, status, duration = 5, forward = false) {
    const timerDocRef = doc(GAMES_COLLECTION_REF, gameId, 'realtime', 'timer')
    await updateDoc(timerDocRef, {
        status,
        duration,
        forward
    })
    console.log("Timer state updated:", status)
}

// WRITE
export async function endTimer(gameId) {
    await updateTimerState(gameId, 'ended')
}

// WRITE
export async function startTimer(gameId, organizerId) {
    const batch = writeBatch(db)

    console.log("Timer started")

    const queueCollectionRef = collection(GAMES_COLLECTION_REF, gameId, 'realtime', 'sounds', 'queue')
    const newSoundDocument = doc(queueCollectionRef);
    batch.set(newSoundDocument, {
        timestamp: serverTimestamp(),
        filename: 'message-incoming',
    })

    const timerDocRef = doc(GAMES_COLLECTION_REF, gameId, 'realtime', 'timer')
    batch.update(timerDocRef, {
        status: 'started'
    })

    await batch.commit()
}

// WRITE
export async function stopTimer(gameId) {
    await updateTimerState(gameId, 'stopped')
}

// WRITE
export async function resetTimer(gameId) {
    await updateTimerState(gameId, 'resetted')
}