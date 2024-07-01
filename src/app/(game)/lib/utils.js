"use server";

import { GAMES_COLLECTION_REF } from '@/lib/firebase/firestore';
import { firestore } from '@/lib/firebase/firebase'
import {
    getDoc,
    doc,
    setDoc,
} from 'firebase/firestore'

export const getDocDataTransaction = async (transaction, docRef) => {
    const docSnap = await transaction.get(docRef);
    return docSnap.data();
};

// export const getDocDataTransaction = async (transaction, ...path) => {
//     const docRef = doc(db, ...path);
//     const docSnap = await transaction.get(docRef);
//     return docSnap.data();
// };

export const updateGameStatusTransaction = async (transaction, gameId, status) => {
    const gameRef = doc(GAMES_COLLECTION_REF, gameId);
    await transaction.update(gameRef, { status });
}

// READ
// Get document data
export async function getDocData(...docPath) {
    try {
        const docRef = doc(firestore, ...docPath);
        const docSnapshot = await getDoc(docRef);
        return docSnapshot.data();
    } catch (error) {
        console.error('Error fetching document:', error);
        throw error;
    }
}

export async function copyDocument(fromRef, toRef) {
    const fromDocData = (await getDoc(fromRef)).data()

    console.log(fromDocData)
    await setDoc(toRef, fromDocData)
}
