
"use server";

import { GAMES_COLLECTION_REF } from '@/lib/firebase/firestore';
import { db } from '@/lib/firebase/firebase'
import {
    collection,
    query,
    where,
    getDocs,
    doc,
    updateDoc,
    writeBatch
} from 'firebase/firestore'

import { getDocData } from '@/app/(game)/lib/utils';

export async function getPlayerData(gameId, playerId) {
    return getDocData('games', gameId, 'players', playerId);
}

async function updatePlayerFields(gameId, playerId, fieldsToUpdate) {
    const playerRef = doc(GAMES_COLLECTION_REF, gameId, 'players', playerId)
    const updateObject = { ...fieldsToUpdate }

    await updateDoc(playerRef, updateObject)
    console.log(`Game ${gameId}, Player ${playerId}:`, fieldsToUpdate)
}


/* ==================================================================================================== */
export async function updatePlayerStatus(gameId, playerId, status) {
    await updatePlayerFields(gameId, playerId, { status })
}

export const updatePlayerStatusTransaction = async (
    transaction,
    gameId,
    playerId,
    status
) => {
    const playerRef = doc(GAMES_COLLECTION_REF, gameId, 'players', playerId)
    transaction.update(playerRef, { status })
}


export async function updateAllPlayersStatuses(gameId, status) {
    const playersCollectionRef = collection(GAMES_COLLECTION_REF, gameId, 'players')
    const q = query(playersCollectionRef)
    const querySnapshot = await getDocs(q)

    const batch = writeBatch(db)
    for (const playerDoc of querySnapshot.docs) {
        batch.update(playerDoc.ref, { status })
    }
    await batch.commit()
}

export async function updateTeamStatus(gameId, teamId, status) {
    const playersCollectionRef = collection(GAMES_COLLECTION_REF, gameId, 'players')
    const q = query(playersCollectionRef, where('teamId', '==', teamId))
    const querySnapshot = await getDocs(q)

    const batch = writeBatch(db)
    for (const playerDoc of querySnapshot.docs) {
        batch.update(playerDoc.ref, { status })
    }
    await batch.commit()
}
