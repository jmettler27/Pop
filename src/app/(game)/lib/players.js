
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

// READ
export async function getPlayerData(gameId, playerId) {
    return getDocData('games', gameId, 'players', playerId);
}



// WRITE
async function updatePlayerFields(gameId, playerId, fieldsToUpdate) {
    const playerRef = doc(GAMES_COLLECTION_REF, gameId, 'players', playerId)
    const updateObject = { ...fieldsToUpdate }

    await updateDoc(playerRef, updateObject)
    console.log(`Game ${gameId}, Player ${playerId}:`, fieldsToUpdate)
}


// WRITE
async function updateTeamFields(gameId, teamId, fieldsToUpdate) {
    const teamRef = doc(GAMES_COLLECTION_REF, gameId, 'teams', teamId)
    const updateObject = { ...fieldsToUpdate }

    await updateDoc(teamRef, updateObject)
    console.log(`Game ${gameId}, Team ${teamId}:`, fieldsToUpdate)
}


/* ==================================================================================================== */
// WRITE
export async function updatePlayerStatus(gameId, playerId, newStatus) {
    await updatePlayerFields(gameId, playerId, { status: newStatus })
}

// BATCHED WRITE
export async function updateAllPlayersStatuses(gameId, newStatus) {
    const playersCollectionRef = collection(GAMES_COLLECTION_REF, gameId, 'players')
    const q = query(playersCollectionRef)
    const querySnapshot = await getDocs(q)

    const batch = writeBatch(db)
    for (const playerDoc of querySnapshot.docs) {
        // updatePlayerStatus(gameId, playerDoc.id, newStatus)
        batch.update(playerDoc.ref, { status: newStatus })
    }
    await batch.commit()
}

// BATCHED WRITE
export async function updateTeamStatus(gameId, teamId, newStatus) {
    const playersCollectionRef = collection(GAMES_COLLECTION_REF, gameId, 'players')
    const q = query(playersCollectionRef, where('teamId', '==', teamId))
    const querySnapshot = await getDocs(q)

    const batch = writeBatch(db)
    for (const playerDoc of querySnapshot.docs) {
        // await updatePlayerStatus(gameId, playerDoc.id, newStatus)
        batch.update(playerDoc.ref, { status: newStatus })
    }
    await batch.commit()
}
