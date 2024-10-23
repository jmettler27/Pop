"use server";

import { GAMES_COLLECTION_REF } from '@/lib/firebase/firestore';
import { firestore } from '@/lib/firebase/firebase'
import {
    doc,
    increment,
    runTransaction,
} from 'firebase/firestore'

import { addSoundEffectTransaction } from '@/app/(game)/lib/sounds';
import { getDocDataTransaction } from '@/app/(game)/lib/utils';
import { updateTimerStateTransaction } from '@/app/(game)/lib/timer';

export async function revealProgressiveClue(gameId, roundId, questionId) {
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
        await runTransaction(firestore, transaction =>
            revealProgressiveClueTransaction(transaction, gameId, roundId, questionId)
        )
        console.log("Next clue click handled successfully.");

    } catch (error) {
        console.error("There was an error handling the next clue click:", error);
        throw error;
    }
}

const revealProgressiveClueTransaction = async (
    transaction,
    gameId,
    roundId,
    questionId,
) => {
    const questionPlayersRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId, 'realtime', 'players')
    const questionRealtimeRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId)
    const roundRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId)

    const [questionPlayersData, questionRealtimeData, roundData] = await Promise.all([
        getDocDataTransaction(transaction, questionPlayersRef),
        getDocDataTransaction(transaction, questionRealtimeRef),
        getDocDataTransaction(transaction, roundRef),
    ])

    const { buzzed, canceled } = questionPlayersData

    // If there is a buzzed player, update his status to idle
    if (buzzed && buzzed.length > 0) {
        const playerRef = doc(GAMES_COLLECTION_REF, gameId, 'players', buzzed[0])
        transaction.update(playerRef, {
            status: 'idle'
        })
        transaction.update(questionPlayersRef, {
            buzzed: []
        })
    }
    transaction.update(questionRealtimeRef, {
        currentClueIdx: increment(1),
    })

    // Decancel players who need it
    if (canceled?.length > 0) {
        const targetClueIdx = questionRealtimeData.currentClueIdx + 1 - roundData.delay
        canceled
            .filter(cancellation => cancellation.clueIdx === targetClueIdx)
            .forEach(cancellation => {
                const playerRef = doc(GAMES_COLLECTION_REF, gameId, 'players', cancellation.playerId);
                transaction.update(playerRef, {
                    status: 'idle'
                });
            });
    }
    // await updateTimerStateTransaction(transaction, gameId, 'reset')
    await addSoundEffectTransaction(transaction, gameId, 'cartoon_mystery_musical_tone_002')
}
/* ====================================================================================================== */
export const resetProgressiveCluesRealtimeTransaction = async (
    transaction,
    gameId,
    roundId,
    questionId
) => {
    const questionRealtimeRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId)
    transaction.update(questionRealtimeRef, {
        currentClueIdx: -1
    })
}