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


export const updateTimerTransaction = async (
    transaction,
    gameId,
    fieldsToUpdate,
) => {
    const timerDocRef = doc(GAMES_COLLECTION_REF, gameId, 'realtime', 'timer')

    const updateObject = { ...fieldsToUpdate, timestamp: serverTimestamp() }
    transaction.update(timerDocRef, updateObject)
    console.log("Timer updated:", fieldsToUpdate)
}


export async function updateTimerState(gameId, status) {
    const timerDocRef = doc(GAMES_COLLECTION_REF, gameId, 'realtime', 'timer')
    await updateDoc(timerDocRef, {
        status,
        timestamp: serverTimestamp()
    })
    console.log("Timer state updated:", status)
}

export const updateTimerStateTransaction = async (
    transaction,
    gameId,
    status,
) => {
    await updateTimerTransaction(transaction, gameId, { status })
}

// WRITE
export async function endTimer(gameId) {
    await updateTimerState(gameId, 'ended')
}

// WRITE
export async function startTimer(gameId) {
    const batch = writeBatch(db)

    const queueCollectionRef = collection(GAMES_COLLECTION_REF, gameId, 'realtime', 'sounds', 'queue')
    const newSoundDocument = doc(queueCollectionRef);
    batch.set(newSoundDocument, {
        timestamp: serverTimestamp(),
        filename: 'message-incoming',
    })

    const timerDocRef = doc(GAMES_COLLECTION_REF, gameId, 'realtime', 'timer')
    batch.update(timerDocRef, {
        status: 'started',
        timestamp: serverTimestamp()
    })

    await batch.commit()
    console.log("Timer started")
}

// WRITE
export async function stopTimer(gameId) {
    await updateTimerState(gameId, 'stopped')
}

// WRITE
export async function resetTimer(gameId) {
    await updateTimerState(gameId, 'resetted')
}