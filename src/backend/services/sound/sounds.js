"use server";

import { firestore } from '@/backend/firebase/firebase'
import { GAMES_COLLECTION_REF } from '@/backend/firebase/firestore';
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


export async function addSound(gameId, filename) {
    const queueCollectionRef = collection(GAMES_COLLECTION_REF, gameId, 'realtime', 'sounds', 'queue')
    await addDoc(queueCollectionRef, {
        timestamp: serverTimestamp(),
        filename: filename,
    })
    console.log(`Game ${gameId} Sound ${filename} added to queue`)
}


export const addSoundTransaction = async (transaction, gameId, filename) => {
    const queueCollectionRef = collection(GAMES_COLLECTION_REF, gameId, 'realtime', 'sounds', 'queue');
    const newSoundDocument = doc(queueCollectionRef);
    transaction.set(newSoundDocument, {
        timestamp: serverTimestamp(),
        filename: filename,
    });
};

export async function clearSounds(gameId) {
    const queueCollectionRef = collection(GAMES_COLLECTION_REF, gameId, 'realtime', 'sounds', 'queue')
    const soundsSnapshot = await getDocs(query(queueCollectionRef))

    const batch = writeBatch(firestore)
    for (const soundDoc of soundsSnapshot.docs) {
        batch.delete(soundDoc.ref)
    }

    await batch.commit()
}



const WRONG_ANSWER_SOUNDS = [
    "roblox_oof",
    "oof",
    "terraria_male_damage",
    "itai"
]

import { getRandomElement } from '@/backend/utils/arrays';

export const addWrongAnswerSoundToQueueTransaction = async (transaction, gameId) => {
    await addSoundTransaction(transaction, getRandomElement(WRONG_ANSWER_SOUNDS))
}