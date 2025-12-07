"use server";

import { GAMES_COLLECTION_REF } from '@/backend/firebase/firestore';
import { firestore } from '@/backend/firebase/firebase'
import {
    collection,
    doc,
    serverTimestamp,
    updateDoc,
    writeBatch,
} from 'firebase/firestore'

import { TimerStatus } from '@/backend/models/Timer'

export const updateTimerTransaction = async (
    transaction,
    gameId,
    fieldsToUpdate,
) => {
    const timerRef = doc(GAMES_COLLECTION_REF, gameId, 'realtime', 'timer')

    const updateObject = { ...fieldsToUpdate, timestamp: serverTimestamp() }
    transaction.update(timerRef, updateObject)
    console.log("Timer updated:", fieldsToUpdate)
}


async function updateTimerState(gameId, status) {
    const timerRef = doc(GAMES_COLLECTION_REF, gameId, 'realtime', 'timer')
    await updateDoc(timerRef, {
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
    await updateTimerState(gameId, TimerStatus.END)
}

// WRITE
export async function startTimer(gameId) {
    const batch = writeBatch(firestore)

    const queueCollectionRef = collection(GAMES_COLLECTION_REF, gameId, 'realtime', 'sounds', 'queue')
    const newSoundDocument = doc(queueCollectionRef);
    batch.set(newSoundDocument, {
        timestamp: serverTimestamp(),
        filename: 'message-incoming',
    })

    const timerRef = doc(GAMES_COLLECTION_REF, gameId, 'realtime', 'timer')
    batch.update(timerRef, {
        status: TimerStatus.START,
        timestamp: serverTimestamp()
    })

    await batch.commit()
    console.log("Timer started")
}

// WRITE
export async function stopTimer(gameId) {
    await updateTimerState(gameId, TimerStatus.STOP)
}

// WRITE
export async function resetTimer(gameId) {
    await updateTimerState(gameId, TimerStatus.RESET)
}