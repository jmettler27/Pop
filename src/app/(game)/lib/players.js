
"use server";

import { GAMES_COLLECTION_REF } from '@/lib/firebase/firestore';
import { firestore } from '@/lib/firebase/firebase'
import {
    collection,
    query,
    getDocs,
    doc,
    writeBatch
} from 'firebase/firestore'

import { getDocData } from '@/app/(game)/lib/utils';

export async function getPlayerData(gameId, playerId) {
    return getDocData('games', gameId, 'players', playerId);
}

/* ==================================================================================================== */
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
    const playersSnapshot = await getDocs(query(playersCollectionRef))

    const batch = writeBatch(firestore)
    for (const playerDoc of playersSnapshot.docs) {
        batch.update(playerDoc.ref, { status })
    }
    await batch.commit()
}