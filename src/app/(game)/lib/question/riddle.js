"use server";

import { GAMES_COLLECTION_REF } from '@/lib/firebase/firestore';
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
import { getDocDataTransaction, updateGameStatusTransaction } from '@/app/(game)/lib/utils';

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
    await updateGameStatusTransaction(transaction, gameId, 'question_end')


    await addSoundToQueueTransaction(transaction, gameId, playerId, 'Anime wow')
}

/* ==================================================================================================== */
/**
 * When the organizer invalidates the answer of a player.
 */
// TRANSACTION
export async function handleRiddleInvalidateAnswerClick(gameId, roundId, questionId, playerId) {
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
            handleRiddleInvalidateAnswerClickTransaction(transaction, gameId, roundId, questionId, playerId)
        );

        console.log(`Player ${playerId} was canceled successfully.`);
    } catch (error) {
        console.error("There was an error adding a canceled player:", error);
        throw error;
    }
}

const handleRiddleInvalidateAnswerClickTransaction = async (
    transaction,
    gameId,
    roundId,
    questionId,
    playerId
) => {
    const realtimeRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId)
    const realtimeData = await getDocDataTransaction(transaction, realtimeRef)
    const clueIdx = realtimeData.currentClueIdx ? realtimeData.currentClueIdx : 0;

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

    await addSoundToQueueTransaction(transaction, gameId, playerId, 'roblox_oof')

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

    addSoundToQueue(gameId, 'sfx-menu-validate', playerId)
}

// BATCHED WRITE
export async function removeBuzzedPlayer(gameId, roundId, questionId, playerId) {
    const batch = writeBatch(db)

    const playersDocRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId, 'realtime', 'players')
    batch.update(playersDocRef, {
        buzzed: arrayRemove(playerId)
    })

    const queueCollectionRef = collection(GAMES_COLLECTION_REF, gameId, 'realtime', 'sounds', 'queue')
    const newSoundDocument = doc(queueCollectionRef);
    batch.set(newSoundDocument, {
        timestamp: serverTimestamp(),
        filename: 'JPP_de_lair',
        uid: playerId
    })

    const playerRef = doc(GAMES_COLLECTION_REF, gameId, 'players', playerId)
    batch.update(playerRef, {
        status: 'idle'
    })

    await batch.commit()
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
    // initRiddleQuestionRealtime(gameId, roundId, questionId)
    const playersDocRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId, 'realtime', 'players')
    batch.set(playersDocRef, {
        buzzed: [],
        canceled: []
    })

    const realtimeDocRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId)
    batch.update(realtimeDocRef, {
        winner: null,
        managedBy: 'YhDISaNL0SaJg2Haa765',
    })

    await batch.commit()
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