"use server";

import { GAMES_COLLECTION_REF } from '@/lib/firebase/firestore';
import { db } from '@/lib/firebase/firebase'
import {
    doc,
    setDoc,
    increment,
    runTransaction,
    updateDoc,
} from 'firebase/firestore'

import { addSoundToQueueTransaction } from '@/app/(game)/lib/sounds';
import { getDocDataTransaction } from '@/app/(game)/lib/utils';


/* ====================================================================================================== */
// TRANSACTION
export async function handleNextClueClick(gameId, roundId, questionId, organizerId) {
    if (!gameId) {
        throw new Error("No game ID has been provided!");
    }
    if (!roundId) {
        throw new Error("No round ID has been provided!");
    }
    if (!questionId) {
        throw new Error("No question ID has been provided!");
    }

    try {
        await runTransaction(db, transaction =>
            handleNextClueClickTransaction(transaction, gameId, roundId, questionId, organizerId)
        )
        console.log("Next clue click handled successfully.");

    } catch (error) {
        console.error("There was an error handling the next clue click:", error);
        throw error;
    }
}

const handleNextClueClickTransaction = async (
    transaction,
    gameId,
    roundId,
    questionId,
    organizerId
) => {
    const playersDocRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId, 'realtime', 'players')
    const realtimeRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId)
    const roundRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId)

    const [playersData, realtimeData, roundData] = await Promise.all([
        getDocDataTransaction(transaction, playersDocRef),
        getDocDataTransaction(transaction, realtimeRef),
        getDocDataTransaction(transaction, roundRef),
    ])

    // If there is a buzzed player, update his status to idle
    const buzzed = playersData.buzzed
    if (buzzed && buzzed.length > 0) {
        // updatePlayerStatus(gameId, buzzed[0], 'idle')
        const playerRef = doc(GAMES_COLLECTION_REF, gameId, 'players', buzzed[0])
        transaction.update(playerRef, {
            status: 'idle'
        })
        // Clear the buzzed
        // resetBuzzedPlayers(gameId, roundId, questionId)
        transaction.update(playersDocRef, {
            buzzed: []
        })
    }

    // Increment the currentClueIdx
    // updateClueFields(gameId, roundId, questionId, {
    //     currentClueIdx: increment(1),
    // })
    transaction.update(realtimeRef, {
        currentClueIdx: increment(1),
    })

    // Decancel players who need it
    const canceled = playersData.canceled
    if (canceled) {
        for (const item of canceled) {
            if (item.clueIdx === (realtimeData.currentClueIdx + 1) - roundData.delay) {
                // await updatePlayerStatus(gameId, item.playerId, 'idle')
                const playerRef = doc(GAMES_COLLECTION_REF, gameId, 'players', item.playerId)
                transaction.update(playerRef, {
                    status: 'idle'
                })
            }
        }
    }

    await addSoundToQueueTransaction(transaction, gameId, 'message-incoming')
}
/* ====================================================================================================== */

// WRITE
export const resetProgressiveCluesRealtimeTransaction = async (
    transaction,
    gameId,
    roundId,
    questionId
) => {
    const realtimeDocRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId)
    transaction.update(realtimeDocRef, {
        currentClueIdx: -1
    })
}