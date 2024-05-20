"use server";

import { GAMES_COLLECTION_REF } from '@/lib/firebase/firestore';
import { firestore } from '@/lib/firebase/firebase'
import {
    doc,
    updateDoc,
    arrayUnion,
    arrayRemove,
    increment,
    serverTimestamp,
    Timestamp,
    runTransaction,
    writeBatch
} from 'firebase/firestore'

import { getDocDataTransaction } from '@/app/(game)/lib/utils';
import { addSoundToQueueTransaction, addWrongAnswerSoundToQueueTransaction } from '@/app/(game)/lib/sounds';
import { updateTimerStateTransaction } from '@/app/(game)/lib/timer';
import { endQuestionTransaction } from '@/app/(game)/lib/question';
import { updatePlayerStatusTransaction } from '@/app/(game)/lib/players';


/* ==================================================================================================== */
export async function handleRiddleBuzzerHeadChanged(gameId, playerId) {
    if (!gameId) {
        throw new Error("No game ID has been provided!");
    }
    if (!playerId) {
        throw new Error("No player ID has been provided!");
    }

    try {
        await runTransaction(firestore, transaction =>
            handleRiddleBuzzerHeadChangedTransaction(transaction, gameId, playerId)
        );
    } catch (error) {
        console.error("There was an error changing the buzzer head:", error);
        throw error;
    }
}

const handleRiddleBuzzerHeadChangedTransaction = async (
    transaction,
    gameId,
    playerId
) => {
    await updatePlayerStatusTransaction(transaction, gameId, playerId, 'focus')
    await updateTimerStateTransaction(transaction, gameId, 'started')
}



/* ==================================================================================================== */

/**
 * When the organizer validates the answer of a player
 */
// TRANSACTION
export async function handleRiddleValidateAnswerClick(gameId, roundId, questionId, playerId, wholeTeam = false) {
    if (!gameId) {
        throw new Error("No game ID has been provided!");
    }
    if (!roundId) {
        throw new Error("No round ID has been provided!");
    }
    if (!questionId) {
        throw new Error("No question ID has been provided!");
    }
    if (!playerId) {
        throw new Error("No player ID has been provided!");
    }

    try {
        // transaction
        await runTransaction(firestore, transaction =>
            handleRiddleValidateAnswerClickTransaction(transaction, gameId, roundId, questionId, playerId, wholeTeam)
        );
    } catch (error) {
        console.error("There was an error validating the player's answer", error);
        throw error;
    }
}

const handleRiddleValidateAnswerClickTransaction = async (
    transaction,
    gameId,
    roundId,
    questionId,
    playerId,
    wholeTeam = false
) => {
    /* Update the winner team scores */
    const playerRef = doc(GAMES_COLLECTION_REF, gameId, 'players', playerId)
    const roundRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId)
    const roundScoresRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'realtime', 'scores')

    const [playerData, roundData, roundScoresData] = await Promise.all([
        getDocDataTransaction(transaction, playerRef),
        getDocDataTransaction(transaction, roundRef),
        getDocDataTransaction(transaction, roundScoresRef)
    ])

    const { teamId } = playerData
    const { rewardsPerQuestion: points } = roundData
    const { scores: currentRoundScores, scoresProgress: currentRoundProgress } = roundScoresData

    const newRoundProgress = {}
    for (const tid of Object.keys(currentRoundScores)) {
        // Add an entry whose key is questionId and value is currentRoundScores[tid
        newRoundProgress[tid] = {
            ...currentRoundProgress[tid],
            [questionId]: currentRoundScores[tid] + (tid === teamId ? points : 0)
        }
    }

    transaction.update(roundScoresRef, {
        [`scores.${teamId}`]: increment(points),
        scoresProgress: newRoundProgress
    })

    // Update the question winner team
    const realtimeDocRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId)
    transaction.update(realtimeDocRef, {
        winner: {
            playerId: playerId,
            teamId: teamId
        },
        dateEnd: serverTimestamp(),
    })

    // Update the winner player status
    transaction.update(playerRef, {
        status: 'correct'
    })

    await endQuestionTransaction(transaction, gameId, roundId, questionId)

    await addSoundToQueueTransaction(transaction, gameId, 'Anime wow')
}

/* ==================================================================================================== */
/**
 * When the organizer invalidates the answer of a player.
 */
// TRANSACTION
export async function handleRiddleInvalidateAnswerClick(gameId, roundId, questionId, playerId, questionType = null) {
    // const questionData = await getQuestionData(gameId, roundId, questionId)
    // if (questionData.type === 'progressive_clues') {
    // TRANSACTION

    if (!gameId) {
        throw new Error("No game ID has been provided!");
    }
    if (!roundId) {
        throw new Error("No round ID has been provided!");
    }
    if (!questionId) {
        throw new Error("No question ID has been provided!");
    }
    if (!playerId) {
        throw new Error("No player ID has been provided!");
    }

    try {
        await runTransaction(firestore, transaction =>
            handleRiddleInvalidateAnswerClickTransaction(transaction, gameId, roundId, questionId, playerId, questionType)
        );

        console.log(`Player ${playerId} was canceled successfully.`);
    } catch (error) {
        console.error("There was an error adding a canceled player:", error);
        throw error;
    }
}

export const handleRiddleInvalidateAnswerClickTransaction = async (
    transaction,
    gameId,
    roundId,
    questionId,
    playerId,
    questionType = null
) => {
    const realtimeRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId)
    const realtimeData = await getDocDataTransaction(transaction, realtimeRef)

    const clueIdx = realtimeData.currentClueIdx || 0;

    const playersDocRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId, 'realtime', 'players')
    transaction.update(playersDocRef, {
        canceled: arrayUnion({
            clueIdx,
            playerId,
            timestamp: Timestamp.now()
        }),
        buzzed: arrayRemove(playerId)
    })

    await Promise.all([
        updatePlayerStatusTransaction(transaction, gameId, playerId, 'wrong'),
        addWrongAnswerSoundToQueueTransaction(transaction, gameId),
        updateTimerStateTransaction(transaction, gameId, 'resetted')
    ])

    // } else {
    //     /* Penalize only the player */
    //     // Remove the player from the buzzed list
    //     await removeBuzzedPlayer(gameId, roundId, questionId, playerId)
    //     updatePlayerStatus(gameId, playerId, 'wrong')
    // }
}


/* ==================================================================================================== */
// WRITE
async function updateRiddleBuzzed(gameId, roundId, questionId, fieldsToUpdate) {
    const playersDocRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId, 'realtime', 'players')
    const updateObject = { ...fieldsToUpdate }

    await updateDoc(playersDocRef, updateObject)
    console.log(`Game ${gameId}, Round ${roundId}, Question ${questionId} : Buzzed list updated`)
}

// export async function addBuzzedPlayer(gameId, roundId, questionId, playerId) {
//     const playersDocRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId, 'realtime', 'players')
//     updateDoc(playersDocRef, {
//         buzzed: arrayUnion(playerId)
//     })

//     addSoundToQueue(gameId, 'sfx-menu-validate')
// }

export async function addBuzzedPlayer(gameId, roundId, questionId, playerId) {
    if (!gameId) {
        throw new Error("No game ID has been provided!");
    }
    if (!roundId) {
        throw new Error("No round ID has been provided!");
    }
    if (!questionId) {
        throw new Error("No question ID has been provided!");
    }
    if (!playerId) {
        throw new Error("No player ID has been provided!");
    }

    try {
        await runTransaction(firestore, transaction =>
            addBuzzedPlayerTransaction(transaction, gameId, roundId, questionId, playerId)
        );
        console.log(`Player ${playerId} has buzzed successfully.`)
    } catch (error) {
        console.error("There was an error adding a buzzed player:", error);
        throw error;
    }
}

const addBuzzedPlayerTransaction = async (
    transaction,
    gameId,
    roundId,
    questionId,
    playerId
) => {
    const playersDocRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId, 'realtime', 'players')
    transaction.update(playersDocRef, {
        buzzed: arrayUnion(playerId)
    })

    addSoundToQueueTransaction(transaction, gameId, 'sfx-menu-validate')
}

/* ==================================================================================================== */
export async function removeBuzzedPlayer(gameId, roundId, questionId, playerId, questionType = null) {
    if (!gameId) {
        throw new Error("No game ID has been provided!");
    }
    if (!roundId) {
        throw new Error("No round ID has been provided!");
    }
    if (!questionId) {
        throw new Error("No question ID has been provided!");
    }
    if (!playerId) {
        throw new Error("No player ID has been provided!");
    }

    try {
        await runTransaction(firestore, async transaction =>
            await removeBuzzedPlayerTransaction(transaction, gameId, roundId, questionId, playerId, questionType)
        );
    } catch (error) {
        console.error("There was an error removing the buzzed player:", error);
        throw error;
    }
}

const removeBuzzedPlayerTransaction = async (
    transaction,
    gameId,
    roundId,
    questionId,
    playerId,
    questionType = null
) => {

    const playersDocRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId, 'realtime', 'players')
    const playersData = await getDocDataTransaction(transaction, playersDocRef)

    // const type = questionType || (await getDocDataTransaction(transaction, doc(QUESTIONS_COLLECTION_REF, questionId))).type

    const { buzzed } = playersData

    transaction.update(playersDocRef, {
        buzzed: arrayRemove(playerId)
    })

    await updatePlayerStatusTransaction(transaction, gameId, playerId, 'idle')
    await addSoundToQueueTransaction(transaction, gameId, 'JPP_de_lair')

    if (buzzed[0] === playerId) {
        await updateTimerStateTransaction(transaction, gameId, 'resetted')
    }
}

/* ==================================================================================================== */
export async function handleRiddleCountdownEnd(gameId, roundId, questionId, questionType = null) {
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
            handleRiddleCountdownEndTransaction(transaction, gameId, roundId, questionId, questionType)
        );
    }
    catch (error) {
        console.error("There was an error handling the countdown end:", error);
        throw error;
    }
}

export const handleRiddleCountdownEndTransaction = async (
    transaction,
    gameId,
    roundId,
    questionId,
    questionType = null
) => {

    const playersDocRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId, 'realtime', 'players')
    const playersData = await getDocDataTransaction(transaction, playersDocRef)
    const { buzzed } = playersData

    if (buzzed.length === 0)
        await updateTimerStateTransaction(transaction, gameId, 'resetted')
    else
        await handleRiddleInvalidateAnswerClickTransaction(transaction, gameId, roundId, questionId, buzzed[0], questionType)
}

/* ==================================================================================================== */
// BATCHED WRITE
export async function resetRiddleQuestion(gameId, roundId, questionId) {
    const batch = writeBatch(firestore)
    const playersDocRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId, 'realtime', 'players')
    batch.set(playersDocRef, {
        buzzed: [],
        canceled: []
    })

    const realtimeDocRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId)
    batch.update(realtimeDocRef, {
        winner: null,
    })

    await batch.commit()
}

export const resetRiddleQuestionTransaction = async (
    transaction,
    gameId,
    roundId,
    questionId
) => {
    const playersDocRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId, 'realtime', 'players')
    transaction.set(playersDocRef, {
        buzzed: [],
        canceled: []
    })

    const realtimeDocRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId)
    transaction.update(realtimeDocRef, {
        winner: null,
    })
}

export async function clearBuzzer(gameId, roundId, questionId) {
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
            clearBuzzerTransaction(transaction, gameId, roundId, questionId)
        );
    }
    catch (error) {
        console.error("There was an error clearing the buzzer:", error);
        throw error;
    }
}

const clearBuzzerTransaction = async (
    transaction,
    gameId,
    roundId,
    questionId
) => {
    const playersDocRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId, 'realtime', 'players')

    const playersData = await getDocDataTransaction(transaction, playersDocRef)
    const { buzzed } = playersData
    for (const playerId of buzzed) {
        await updatePlayerStatusTransaction(transaction, gameId, playerId, 'idle')
    }

    transaction.update(playersDocRef, {
        buzzed: []
    })

    await updateTimerStateTransaction(transaction, gameId, 'resetted')

    await addSoundToQueueTransaction(transaction, gameId, 'robinet_desert')

}