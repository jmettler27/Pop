"use server";

import { GAMES_COLLECTION_REF, QUESTIONS_COLLECTION_REF } from '@/lib/firebase/firestore';
import { db } from '@/lib/firebase/firebase'
import {
    collection,
    doc,
    setDoc,
    updateDoc,
    arrayUnion,
    arrayRemove,
    increment,
    serverTimestamp,
    Timestamp,
    runTransaction,
    writeBatch
} from 'firebase/firestore'

import { addSoundToQueue, addSoundToQueueTransaction } from '@/app/(game)/lib/sounds';
import { getDocDataTransaction } from '@/app/(game)/lib/utils';
import { updateTimerTransaction } from '../timer';
import { DEFAULT_THINKING_TIME_SECONDS } from '@/lib/utils/question/question';
import { endQuestionTransaction } from '../question';


/* ==================================================================================================== */
export async function handleRiddleBuzzerHeadChanged(gameId, questionId, playerId) {
    if (!gameId) {
        throw new Error("No game ID has been provided!");
    }

    if (!questionId) {
        throw new Error("No question ID has been provided!");
    }
    if (!playerId) {
        throw new Error("No player ID has been provided!");
    }

    try {
        await runTransaction(db, transaction =>
            handleRiddleBuzzerHeadChangedTransaction(transaction, gameId, questionId, playerId)
        );
    } catch (error) {
        console.error("There was an error changing the buzzer head:", error);
        throw error;
    }
}

const handleRiddleBuzzerHeadChangedTransaction = async (
    transaction,
    gameId,
    questionId,
    playerId
) => {
    const playerDocRef = doc(GAMES_COLLECTION_REF, gameId, 'players', playerId)
    transaction.update(playerDocRef, {
        status: 'focus'
    })
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
        await runTransaction(db, transaction =>
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

    // Update the game status
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
        await runTransaction(db, transaction =>
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
            clueIdx: clueIdx,
            playerId: playerId,
            timestamp: Timestamp.now()
        }),
        buzzed: arrayRemove(playerId)
    })

    // updatePlayerStatus(gameId, playerId, 'wrong')
    const playerRef = doc(GAMES_COLLECTION_REF, gameId, 'players', playerId)
    transaction.update(playerRef, {
        status: 'wrong'
    })

    await addSoundToQueueTransaction(transaction, gameId, 'roblox_oof')

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

export async function addBuzzedPlayer(gameId, roundId, questionId, playerId) {
    const playersDocRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId, 'realtime', 'players')
    updateDoc(playersDocRef, {
        buzzed: arrayUnion(playerId)
    })

    addSoundToQueue(gameId, 'sfx-menu-validate')
}

/* ==================================================================================================== */
// BATCHED WRITE
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
        await runTransaction(db, async transaction =>
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
    transaction.update(playersDocRef, {
        buzzed: arrayRemove(playerId)
    })

    const queueCollectionRef = collection(GAMES_COLLECTION_REF, gameId, 'realtime', 'sounds', 'queue')
    const newSoundDocument = doc(queueCollectionRef);
    transaction.set(newSoundDocument, {
        timestamp: serverTimestamp(),
        filename: 'JPP_de_lair',
    })

    const playerRef = doc(GAMES_COLLECTION_REF, gameId, 'players', playerId)
    transaction.update(playerRef, {
        status: 'idle'
    })

}

/* ==================================================================================================== */
// WRITE
export async function resetBuzzedPlayers(gameId, roundId, questionId) {
    await updateRiddleBuzzed(gameId, roundId, questionId, {
        buzzed: []
    })
}

// WRITE
export async function resetCanceledPlayers(gameId, roundId, questionId) {
    await updateRiddleBuzzed(gameId, roundId, questionId, {
        canceled: []
    })
}

// WRITE
async function initRiddleQuestionRealtime(gameId, roundId, questionId) {
    const playersDocRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId, 'realtime', 'players')
    await setDoc(playersDocRef, {
        buzzed: [],
        canceled: []
    })
}

// Riddles
// BATCHED WRITE
export async function resetRiddleQuestion(gameId, roundId, questionId) {
    const batch = writeBatch(db)
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
    const batch = writeBatch(db)

    const playersDocRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId, 'realtime', 'players')
    batch.update(playersDocRef, {
        buzzed: []
    })

    const playersCollectionRef = collection(GAMES_COLLECTION_REF, gameId, 'players')
    const playersQuerySnapshot = await playersCollectionRef.get()
    playersQuerySnapshot.forEach(doc => {
        batch.update(doc.ref, {
            status: 'idle'
        })
    })

    await batch.commit()
}