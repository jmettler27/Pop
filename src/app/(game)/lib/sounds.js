"use server";

import { firestore } from '@/lib/firebase/firebase'
import { GAMES_COLLECTION_REF } from '@/lib/firebase/firestore';
import {
    collection,
    query,
    getDocs,
    addDoc,
    doc,
    updateDoc,
    serverTimestamp,
    writeBatch
} from 'firebase/firestore'

// WRITE
export async function addSoundToQueue(gameId, filename) {
    const queueCollectionRef = collection(GAMES_COLLECTION_REF, gameId, 'realtime', 'sounds', 'queue')
    await addDoc(queueCollectionRef, {
        timestamp: serverTimestamp(),
        filename: filename,
    })
    console.log(`Game ${gameId} Sound ${filename} added to queue`)
}


export const addSoundToQueueTransaction = async (transaction, gameId, filename) => {
    const queueCollectionRef = collection(GAMES_COLLECTION_REF, gameId, 'realtime', 'sounds', 'queue');
    const newSoundDocument = doc(queueCollectionRef);
    transaction.set(newSoundDocument, {
        timestamp: serverTimestamp(),
        filename: filename,
    });
};

// BATCHED WRITE
export async function clearSounds(gameId) {
    const queueCollectionRef = collection(GAMES_COLLECTION_REF, gameId, 'realtime', 'sounds', 'queue')
    const querySnapshot = await getDocs(query(queueCollectionRef))

    const batch = writeBatch(firestore)
    for (const doc of querySnapshot.docs) {
        // await deleteDoc(doc.ref)
        batch.delete(doc.ref)
    }

    await batch.commit()
}



const WRONG_ANSWER_SOUNDS = [
    "roblox_oof",
    "oof",
    "terraria_male_damage"
]

import { getRandomElement } from '@/lib/utils/arrays';

export const addWrongAnswerSoundToQueueTransaction = async (transaction, gameId) => {
    await addSoundToQueueTransaction(transaction, gameId, getRandomElement(WRONG_ANSWER_SOUNDS))
}