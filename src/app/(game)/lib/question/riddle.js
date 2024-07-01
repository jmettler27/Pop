"use server";

import { GAMES_COLLECTION_REF } from '@/lib/firebase/firestore';
import { firestore } from '@/lib/firebase/firebase'
import {
    doc,
    updateDoc,
    arrayUnion,
    arrayRemove,
    Timestamp,
    runTransaction,
    writeBatch
} from 'firebase/firestore'

import { addSoundEffectTransaction, addWrongAnswerSoundToQueueTransaction } from '@/app/(game)/lib/sounds';
import { getDocDataTransaction } from '@/app/(game)/lib/utils';
import { updateTimerStateTransaction } from '@/app/(game)/lib/timer';
import { endQuestionTransaction } from '@/app/(game)/lib/question';
import { updatePlayerStatusTransaction } from '@/app/(game)/lib/players';
import { increaseRoundTeamScoreTransaction } from '@/app/(game)/lib/scores';


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
    // await updateTimerStateTransaction(transaction, gameId, 'start')
}

/* ==================================================================================================== */
/**
 * When the organizer validates the answer of a player
 */
export async function validateRiddleAnswer(gameId, roundId, questionId, playerId, wholeTeam = false) {
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
            validateRiddleAnswerTransaction(transaction, gameId, roundId, questionId, playerId, wholeTeam)
        );
    } catch (error) {
        console.error("There was an error validating the player's answer", error);
        throw error;
    }
}

const validateRiddleAnswerTransaction = async (
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

    const [playerData, roundData] = await Promise.all([
        getDocDataTransaction(transaction, playerRef),
        getDocDataTransaction(transaction, roundRef),
    ])

    const { teamId } = playerData
    const { rewardsPerQuestion: points } = roundData

    await increaseRoundTeamScoreTransaction(transaction, gameId, roundId, questionId, teamId, points)

    // Update the winner player status
    transaction.update(playerRef, {
        status: 'correct'
    })

    // Update the question winner team
    const questionRealtimeRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId)
    transaction.update(questionRealtimeRef, {
        winner: { playerId, teamId },
    })
    await addSoundEffectTransaction(transaction, gameId, 'Anime wow')
    await endQuestionTransaction(transaction, gameId, roundId, questionId)
}

/* ==================================================================================================== */
/**
 * When the organizer invalidates the answer of a player.
 */
export async function invalidateRiddleAnswer(gameId, roundId, questionId, playerId, questionType = null) {
    // const questionData = await getQuestionData(gameId, roundId, questionId)
    // if (questionData.type === 'progressive_clues') {

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
            invalidateRiddleAnswerTransaction(transaction, gameId, roundId, questionId, playerId, questionType)
        );

        console.log(`Player ${playerId} was canceled successfully.`);
    } catch (error) {
        console.error("There was an error adding a canceled player:", error);
        throw error;
    }
}

export const invalidateRiddleAnswerTransaction = async (
    transaction,
    gameId,
    roundId,
    questionId,
    playerId,
    questionType = null
) => {
    const questionRealtimeRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId)
    const questionRealtimeData = await getDocDataTransaction(transaction, questionRealtimeRef)
    const clueIdx = questionRealtimeData.currentClueIdx || 0;

    const questionPlayersRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId, 'realtime', 'players')
    transaction.update(questionPlayersRef, {
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
        // updateTimerStateTransaction(transaction, gameId, 'reset')
    ])

    // } else {
    //     /* Penalize only the player */
    //     // Remove the player from the buzzed list
    //     await removeBuzzedPlayer(gameId, roundId, questionId, playerId)
    //     updatePlayerStatus(gameId, playerId, 'wrong')
    // }
}


/* ==================================================================================================== */
async function updateRiddleBuzzed(gameId, roundId, questionId, fieldsToUpdate) {
    const questionPlayersRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId, 'realtime', 'players')
    const updateObject = { ...fieldsToUpdate }

    await updateDoc(questionPlayersRef, updateObject)
    console.log(`Game ${gameId}, Round ${roundId}, Question ${questionId} : Buzzed list updated`)
}

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
    const questionPlayersRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId, 'realtime', 'players')
    transaction.update(questionPlayersRef, {
        buzzed: arrayUnion(playerId)
    })
    addSoundEffectTransaction(transaction, gameId, 'sfx-menu-validate')
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

    const questionPlayersRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId, 'realtime', 'players')
    // const questionPlayersData = await getDocDataTransaction(transaction, questionPlayersRef)

    // const type = questionType || (await getDocDataTransaction(transaction, doc(QUESTIONS_COLLECTION_REF, questionId))).type

    // const { buzzed } = questionPlayersData

    transaction.update(questionPlayersRef, {
        buzzed: arrayRemove(playerId)
    })
    await updatePlayerStatusTransaction(transaction, gameId, playerId, 'idle')
    await addSoundEffectTransaction(transaction, gameId, 'JPP_de_lair')

    // if (buzzed[0] === playerId) {
    //     await updateTimerStateTransaction(transaction, gameId, 'reset')
    // }
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

    const questionPlayersRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId, 'realtime', 'players')
    const questionPlayersData = await getDocDataTransaction(transaction, questionPlayersRef)
    const { buzzed } = questionPlayersData

    if (buzzed.length === 0)
        await updateTimerStateTransaction(transaction, gameId, 'reset')
    else
        await invalidateRiddleAnswerTransaction(transaction, gameId, roundId, questionId, buzzed[0], questionType)
}

/* ==================================================================================================== */
export async function resetRiddleQuestion(gameId, roundId, questionId) {
    const batch = writeBatch(firestore)
    const questionPlayersRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId, 'realtime', 'players')
    batch.set(questionPlayersRef, {
        buzzed: [],
        canceled: []
    })

    const questionRealtimeRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId)
    batch.update(questionRealtimeRef, {
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
    const questionPlayersRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId, 'realtime', 'players')
    transaction.set(questionPlayersRef, {
        buzzed: [],
        canceled: []
    })

    const questionRealtimeRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId)
    transaction.update(questionRealtimeRef, {
        winner: null,
    })
}

/* ==================================================================================================== */
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
    const questionPlayersRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId, 'realtime', 'players')
    const questionPlayersData = await getDocDataTransaction(transaction, questionPlayersRef)

    const { buzzed } = questionPlayersData
    for (const playerId of buzzed) {
        await updatePlayerStatusTransaction(transaction, gameId, playerId, 'idle')
    }
    transaction.update(questionPlayersRef, {
        buzzed: []
    })
    await updateTimerStateTransaction(transaction, gameId, 'reset')
    await addSoundEffectTransaction(transaction, gameId, 'robinet_desert')
}