
"use server";

import { GAMES_COLLECTION_REF, QUESTIONS_COLLECTION_REF } from '@/lib/firebase/firestore';
import { firestore } from '@/lib/firebase/firebase'
import {
    doc,
    arrayUnion,
    arrayRemove,
    Timestamp,
    runTransaction,
} from 'firebase/firestore'

import { isObjectEmpty } from '@/lib/utils';

import { addSoundEffectTransaction, addWrongAnswerSoundToQueueTransaction } from '@/app/(game)/lib/sounds';
import { getDocDataTransaction } from '@/app/(game)/lib/utils';
import { endQuestionTransaction } from '@/app/(game)/lib/question';
import { updateTimerStateTransaction } from '@/app/(game)/lib/timer';
import { updatePlayerStatusTransaction } from '@/app/(game)/lib/players';
import { increaseRoundTeamScoreTransaction } from '@/app/(game)/lib/scores';
import { range } from '@/lib/utils/arrays';

/**
 * When the organizer reveals an element from the quote (author, source, quote part)
 */
export async function revealLabel(gameId, roundId, questionId, labelIdx, wholeTeam = false) {
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
        // transaction
        await runTransaction(firestore, transaction =>
            revealLabelTransaction(transaction, gameId, roundId, questionId, labelIdx, wholeTeam)
        );
    } catch (error) {
        console.error("There was an error validating the quote element", error);
        throw error;
    }
}

const revealLabelTransaction = async (
    transaction,
    gameId,
    roundId,
    questionId,
    labelIdx,
    _wholeTeam = false
) => {

    const questionRef = doc(QUESTIONS_COLLECTION_REF, questionId)
    const roundRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId)
    const questionRealtimeRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId)
    const questionPlayersRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId, 'realtime', 'players')

    const [questionData, roundData, questionRealtimeData, questionPlayersData] = await Promise.all([
        getDocDataTransaction(transaction, questionRef),
        getDocDataTransaction(transaction, roundRef),
        getDocDataTransaction(transaction, questionRealtimeRef),
        getDocDataTransaction(transaction, questionPlayersRef)
    ])

    const playerId = questionPlayersData.buzzed[0] || null

    const { revealed } = questionRealtimeData
    const newRevealed = revealed
    newRevealed[labelIdx] = {
        revealedAt: Timestamp.now(),
        playerId,
    }

    /* Update the winner team scores */
    if (playerId) {
        const playerRef = doc(GAMES_COLLECTION_REF, gameId, 'players', playerId)
        const playerData = await getDocDataTransaction(transaction, playerRef)

        const { teamId } = playerData
        const { rewardsPerElement: points } = roundData
        await increaseRoundTeamScoreTransaction(transaction, gameId, roundId, questionId, teamId, points)

        transaction.update(playerRef, {
            status: 'correct'
        })
    }

    const { labels } = questionData.details

    const allRevealed = range(labels.length).every(index => {
        return newRevealed[index] && !isObjectEmpty(newRevealed[index]);
    });

    transaction.update(questionRealtimeRef, {
        revealed: newRevealed
    })

    // If all revealed
    if (allRevealed) {
        await addSoundEffectTransaction(transaction, gameId, 'Anime wow')
        await endQuestionTransaction(transaction, gameId, roundId, questionId)
        return
    }
    await addSoundEffectTransaction(transaction, gameId, playerId ? 'super_mario_world_coin' : 'cartoon_mystery_musical_tone_002')
}

/* ==================================================================================================== */
export async function validateAllLabels(gameId, roundId, questionId, playerId) {
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
            validateAllLabelsTransaction(transaction, gameId, roundId, questionId, playerId)
        );
    } catch (error) {
        console.error("There was an error validating the quote element", error);
        throw error;
    }
}

const validateAllLabelsTransaction = async (
    transaction,
    gameId,
    roundId,
    questionId,
    playerId
) => {

    const questionRef = doc(QUESTIONS_COLLECTION_REF, questionId)
    const roundRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId)
    const questionRealtimeRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId)
    const playerRef = doc(GAMES_COLLECTION_REF, gameId, 'players', playerId)

    const [questionData, roundData, questionRealtimeData, playerData] = await Promise.all([
        getDocDataTransaction(transaction, questionRef),
        getDocDataTransaction(transaction, roundRef),
        getDocDataTransaction(transaction, questionRealtimeRef),
        getDocDataTransaction(transaction, playerRef)
    ])

    const { revealed } = questionRealtimeData
    const newRevealed = revealed

    const { labels } = questionData.details

    const timestamp = Timestamp.now();

    newRevealed.fill({
        revealedAt: timestamp,
        playerId,
    })

    /* Update the winner team scores */
    const { teamId } = playerData
    const { rewardsPerElement } = roundData
    const multiplier = labels.length
    const points = rewardsPerElement * multiplier;
    await increaseRoundTeamScoreTransaction(transaction, gameId, roundId, questionId, teamId, points)

    transaction.update(playerRef, {
        status: 'correct'
    })

    transaction.update(questionRealtimeRef, {
        revealed: newRevealed,
    })

    await addSoundEffectTransaction(transaction, gameId, 'Anime wow')
    await endQuestionTransaction(transaction, gameId, roundId, questionId)
}



/* ==================================================================================================== */
/**
 * When the organizer invalidates the answer of a player.
 */
export async function cancelLabelPlayer(gameId, roundId, questionId, playerId, wholeTeam = false) {
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
            cancelLabelPlayerTransaction(transaction, gameId, roundId, questionId, playerId, wholeTeam)
        );

        console.log(`Player ${playerId} was canceled successfully.`);
    } catch (error) {
        console.error("There was an error adding a canceled player:", error);
        throw error;
    }
}

export const cancelLabelPlayerTransaction = async (
    transaction,
    gameId,
    roundId,
    questionId,
    playerId,
    _wholeTeam = false
) => {
    const questionPlayersRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId, 'realtime', 'players')

    transaction.update(questionPlayersRef, {
        canceled: arrayUnion({
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
}


/* ==================================================================================================== */
export async function handleLabelCountdownEnd(gameId, roundId, questionId) {
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
            handleLabelCountdownEndTransaction(transaction, gameId, roundId, questionId)
        )
        console.log("Quote countdown end handled successfully.");
    } catch (error) {
        console.error("There was an error handling the quote countdown end:", error);
        throw error;
    }
}

export const handleLabelCountdownEndTransaction = async (
    transaction,
    gameId,
    roundId,
    questionId
) => {

    const questionPlayersRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId, 'realtime', 'players')
    const { buzzed } = await getDocDataTransaction(transaction, questionPlayersRef)

    if (buzzed.length === 0)
        await updateTimerStateTransaction(transaction, gameId, 'reset')
    else
        await cancelLabelPlayerTransaction(transaction, gameId, roundId, questionId, buzzed[0])
}

/* ==================================================================================================== */
export const resetLabelQuestionTransaction = async (
    transaction,
    gameId,
    roundId,
    questionId
) => {
    const questionRef = doc(QUESTIONS_COLLECTION_REF, questionId)
    const questionData = await getDocDataTransaction(transaction, questionRef)
    const { labels } = questionData.details

    const questionRealtimePlayersRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId, 'realtime', 'players')
    transaction.set(questionRealtimePlayersRef, {
        buzzed: [],
        canceled: []
    })

    const initialRevealed = Array.from({ length: labels.length }, () => ({}));

    const questionRealtimeRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId)
    transaction.update(questionRealtimeRef, {
        revealed: initialRevealed
    })
}