"use server";

import { GAMES_COLLECTION_REF } from '@/backend/firebase/firestore';
import { firestore } from '@/backend/firebase/firebase'
import {
    doc,
    updateDoc,
    arrayUnion,
    arrayRemove,
    Timestamp,
    runTransaction,
    writeBatch
} from 'firebase/firestore'

import { addSoundTransaction, addWrongAnswerSoundToQueueTransaction } from '@/backend/services/sound/sounds';
import { getDocDataTransaction } from '@/backend/services/utils';
import { updateTimerStateTransaction } from '@/backend/services/timer/timer';
import { endQuestionTransaction } from '@/backend/services/question/actions';
import { updatePlayerStatusTransaction } from '@/backend/services/game/player/players';
import { increaseRoundTeamScoreTransaction } from '@/backend/services/scoring/scores';

import { PlayerStatus } from '@/backend/models/users/Player';
import { TimerStatus } from '@/backend/models/Timer';


export async function resetRiddleQuestion(gameId, roundId, questionId) {
    const batch = writeBatch(firestore)
    const questionPlayersRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId, 'realtime', 'players')
    batch.set(questionPlayersRef, {
        buzzed: [],
        canceled: []
    })

    const gameQuestionRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId)
    batch.update(gameQuestionRef, {
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

    const gameQuestionRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId)
    transaction.update(gameQuestionRef, {
        winner: null,
    })
}

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
        await updateTimerStateTransaction(transaction, gameId, TimerStatus.RESET)
    else
        await invalidateRiddleAnswerTransaction(transaction, gameId, roundId, questionId, buzzed[0], questionType)
}

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
    await updatePlayerStatusTransaction(transaction, gameId, playerId, PlayerStatus.FOCUS)
    // await updateTimerStateTransaction(transaction, gameId, TimerStatus.START)
}

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
        status: PlayerStatus.CORRECT
    })

    // Update the question winner team
    const gameQuestionRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId)
    transaction.update(gameQuestionRef, {
        winner: { playerId, teamId },
    })
    await addSoundTransaction(transaction, gameId, 'Anime wow')
    await endQuestionTransaction(transaction, gameId, roundId, questionId)
}

/**
 * When the organizer invalidates the answer of a player.
 */
export async function invalidateRiddleAnswer(gameId, roundId, questionId, playerId, questionType = null) {
    // const baseQuestion = await getQuestionData(gameId, roundId, questionId)
    // if (baseQuestion.type === QuestionType.PROGRESSIVE_CLUES) {

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
    const gameQuestionRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId)
    const gameQuestionData = await getDocDataTransaction(transaction, gameQuestionRef)
    const clueIdx = gameQuestionData.currentClueIdx || 0;

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
        updatePlayerStatusTransaction(transaction, gameId, playerId, PlayerStatus.WRONG),
        addWrongAnswerSoundToQueueTransaction(transaction, gameId),
        // updateTimerStateTransaction(transaction, gameId, TimerStatus.RESET)
    ])

    // } else {
    //     /* Penalize only the player */
    //     // Remove the player from the buzzed list
    //     await removePlayerFromBuzzer(gameId, roundId, questionId, playerId)
    //     updatePlayerStatus(gameId, playerId, 'wrong')
    // }
}


async function updateRiddleBuzzed(gameId, roundId, questionId, fieldsToUpdate) {
    const questionPlayersRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId, 'realtime', 'players')
    const updateObject = { ...fieldsToUpdate }

    await updateDoc(questionPlayersRef, updateObject)
    console.log(`Game ${gameId}, Round ${roundId}, Question ${questionId} : Buzzed list updated`)
}

export async function addPlayerToBuzzer(gameId, roundId, questionId, playerId) {
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
            addPlayerToBuzzerTransaction(transaction, gameId, roundId, questionId, playerId)
        );
        console.log(`Player ${playerId} has buzzed successfully.`)
    } catch (error) {
        console.error("There was an error adding a buzzed player:", error);
        throw error;
    }
}

const addPlayerToBuzzerTransaction = async (
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
    addSoundTransaction(transaction, gameId, 'sfx-menu-validate')
}

export async function removePlayerFromBuzzer(gameId, roundId, questionId, playerId, questionType = null) {
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
            await removePlayerFromBuzzerTransaction(transaction, gameId, roundId, questionId, playerId, questionType)
        );
    } catch (error) {
        console.error("There was an error removing the buzzed player:", error);
        throw error;
    }
}

const removePlayerFromBuzzerTransaction = async (
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
    await updatePlayerStatusTransaction(transaction, gameId, playerId, PlayerStatus.IDLE)
    await addSoundTransaction(transaction, gameId, 'JPP_de_lair')

    // if (buzzed[0] === playerId) {
    //     await updateTimerStateTransaction(transaction, gameId, TimerStatus.RESET)
    // }
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
    const questionPlayersRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId, 'realtime', 'players')
    const questionPlayersData = await getDocDataTransaction(transaction, questionPlayersRef)

    const { buzzed } = questionPlayersData
    for (const playerId of buzzed) {
        await updatePlayerStatusTransaction(transaction, gameId, playerId, PlayerStatus.IDLE)
    }
    transaction.update(questionPlayersRef, {
        buzzed: []
    })
    await updateTimerStateTransaction(transaction, gameId, TimerStatus.RESET)
    await addSoundTransaction(transaction, gameId, 'robinet_desert')
}