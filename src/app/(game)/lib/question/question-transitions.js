"use server";

import { GAMES_COLLECTION_REF } from '@/lib/firebase/firestore';
import { db } from '@/lib/firebase/firebase'
import {
    doc,
    runTransaction,
} from 'firebase/firestore'


import { addSoundToQueueTransaction } from '@/app/(game)/lib/sounds';
import { getDocDataTransaction } from '@/app/(game)/lib/utils';
import { updateTimerTransaction } from '../timer';


export async function setPlayerReady(gameId, playerId) {
    if (!gameId) {
        throw new Error("No game ID has been provided!");
    }
    if (!playerId) {
        throw new Error("No player ID has been provided!");
    }

    try {
        await runTransaction(db, transaction =>
            setPlayerReadyTransaction(transaction, gameId, playerId)
        )
    } catch (error) {
        console.error("There was an error setting the player status to ready:", error);
        throw error;
    }
}

const setPlayerReadyTransaction = async (
    transaction,
    gameId,
    playerId
) => {
    const gameReadyDocRef = doc(GAMES_COLLECTION_REF, gameId, 'realtime', 'ready')
    const gameReadyData = await getDocDataTransaction(transaction, gameReadyDocRef)
    const { numReady, numPlayers } = gameReadyData
    const newNumReady = numReady + 1

    const playerDocRef = doc(GAMES_COLLECTION_REF, gameId, 'players', playerId)
    transaction.update(playerDocRef, {
        status: 'ready'
    })

    transaction.update(gameReadyDocRef, {
        numReady: newNumReady
    })

    await addSoundToQueueTransaction(transaction, gameId, 'pop')

    if (newNumReady === numPlayers) {
        // Launch timer
        await updateTimerTransaction(transaction, gameId, {
            status: 'started',
            duration: 5,
            forward: false
        })
    }
}