"use server";

import { GAMES_COLLECTION_REF, QUESTIONS_COLLECTION_REF } from '@/backend/firebase/firestore';
import { firestore } from '@/backend/firebase/firebase'
import {
    doc,
    arrayUnion,
    arrayRemove,
    serverTimestamp,
    Timestamp,
    runTransaction,
} from 'firebase/firestore'

import { isObjectEmpty } from '@/backend/utils/objects';
import { QuoteQuestion } from '@/backend/models/questions/Quote';

import { addSoundTransaction, addWrongAnswerSoundToQueueTransaction } from '@/backend/services/sound/sounds';
import { getDocDataTransaction } from '@/backend/services/utils';
import { endQuestionTransaction } from '@/backend/services/question/actions';
import { updateTimerStateTransaction } from '@/backend/services/timer/timer';
import { updatePlayerStatusTransaction } from '@/backend/services/game/player/players';
import { increaseRoundTeamScoreTransaction } from '@/backend/services/scoring/scores';

import { PlayerStatus } from '@/backend/models/users/Player';
import { TimerStatus } from '@/backend/models/Timer';


/**
 * When the organizer reveals an element from the quote (author, source, quote part)
 */
export async function revealQuoteElement(gameId, roundId, questionId, quoteElem, quotePartIdx = null, wholeTeam = false) {
    if (!gameId) {
        throw new Error("No game ID has been provided!");
    }
    if (!roundId) {
        throw new Error("No round ID has been provided!");
    }
    if (!questionId) {
        throw new Error("No question ID has been provided!");
    }
    if (!QuoteQuestion.ELEMENTS.includes(quoteElem)) {
        throw new Error("The quote element is not valid!");
    }
    if (quoteElem === 'quote' && quotePartIdx === null) {
        throw new Error("The quote part index is not valid!");
    }

    try {
        // transaction
        await runTransaction(firestore, transaction =>
            revealQuoteElementTransaction(transaction, gameId, roundId, questionId, quoteElem, quotePartIdx, wholeTeam)
        );
    } catch (error) {
        console.error("There was an error validating the quote element", error);
        throw error;
    }
}

const revealQuoteElementTransaction = async (
    transaction,
    gameId,
    roundId,
    questionId,
    quoteElem,
    quotePartIdx = null,
    wholeTeam = false
) => {

    const baseQuestionRef = doc(QUESTIONS_COLLECTION_REF, questionId)
    const roundRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId)
    const gameQuestionRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId)
    const questionPlayersRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId, 'realtime', 'players')

    const [baseQuestion, roundData, gameQuestionData, questionPlayersData] = await Promise.all([
        getDocDataTransaction(transaction, baseQuestionRef),
        getDocDataTransaction(transaction, roundRef),
        getDocDataTransaction(transaction, gameQuestionRef),
        getDocDataTransaction(transaction, questionPlayersRef)
    ])

    const playerId = questionPlayersData.buzzed[0] || null

    const { revealed } = gameQuestionData
    const newRevealed = revealed
    if (quoteElem === 'quote') {
        newRevealed[quoteElem][quotePartIdx] = {
            revealedAt: serverTimestamp(),
            playerId,
        }
    } else {
        newRevealed[quoteElem] = {
            revealedAt: serverTimestamp(),
            playerId,
        }
    }

    /* Update the winner team scores */
    if (playerId) {
        const playerRef = doc(GAMES_COLLECTION_REF, gameId, 'players', playerId)
        const playerData = await getDocDataTransaction(transaction, playerRef)

        const { teamId } = playerData
        const { rewardsPerElement: points } = roundData
        await increaseRoundTeamScoreTransaction(transaction, gameId, roundId, questionId, teamId, points)

        transaction.update(playerRef, {
            status: PlayerStatus.CORRECT
        })
    }

    const { toGuess, quoteParts } = baseQuestion.details

    const temp1 = toGuess.every(elem => newRevealed[elem] && !isObjectEmpty(newRevealed[elem]))
    const newRevealedQuote = newRevealed['quote']
    const temp2 = quoteParts.every((_, idx) => newRevealedQuote[idx] && !isObjectEmpty(newRevealedQuote[idx]))
    const allRevealed = temp1 && temp2

    transaction.update(gameQuestionRef, {
        revealed: newRevealed
    })

    // If all revealed
    if (allRevealed) {
        await addSoundTransaction(transaction, gameId, 'Anime wow')
        await endQuestionTransaction(transaction, gameId, roundId, questionId)
        return
    }
    await addSoundTransaction(transaction, gameId, playerId ? 'super_mario_world_coin' : 'cartoon_mystery_musical_tone_002')
}

/* ==================================================================================================== */
export async function validateAllQuoteElements(gameId, roundId, questionId, playerId) {
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
            validateAllQuoteElementsTransaction(transaction, gameId, roundId, questionId, playerId)
        );
    } catch (error) {
        console.error("There was an error validating the quote element", error);
        throw error;
    }
}

const validateAllQuoteElementsTransaction = async (
    transaction,
    gameId,
    roundId,
    questionId,
    playerId
) => {

    const baseQuestionRef = doc(QUESTIONS_COLLECTION_REF, questionId)
    const roundRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId)
    const gameQuestionRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId)
    const playerRef = doc(GAMES_COLLECTION_REF, gameId, 'players', playerId)

    const [baseQuestion, roundData, gameQuestionData, playerData] = await Promise.all([
        getDocDataTransaction(transaction, baseQuestionRef),
        getDocDataTransaction(transaction, roundRef),
        getDocDataTransaction(transaction, gameQuestionRef),
        getDocDataTransaction(transaction, playerRef)
    ])

    const { revealed } = gameQuestionData
    const newRevealed = revealed

    const { toGuess, quoteParts } = baseQuestion.details

    const timestamp = serverTimestamp();
    for (const quoteElem of toGuess) {
        if (quoteElem === 'quote') {
            for (let i = 0; i < quoteParts.length; i++) {
                newRevealed[quoteElem][i] = {
                    revealedAt: timestamp,
                    playerId,
                }
            }
        } else {
            newRevealed[quoteElem] = {
                revealedAt: timestamp,
                playerId,
            }
        }
    }


    /* Update the winner team scores */
    const { teamId } = playerData
    const { rewardsPerElement } = roundData
    const multiplier = toGuess.length + toGuess.includes('quote') * (quoteParts.length - 1);
    const points = rewardsPerElement * multiplier;
    await increaseRoundTeamScoreTransaction(transaction, gameId, roundId, questionId, teamId, points)
    transaction.update(playerRef, {
        status: PlayerStatus.CORRECT
    })

    transaction.update(gameQuestionRef, {
        revealed: newRevealed,
    })

    await addSoundTransaction(transaction, gameId, 'Anime wow')
    await endQuestionTransaction(transaction, gameId, roundId, questionId)
}


/* ==================================================================================================== */
/**
 * When the organizer invalidates the answer of a player.
 */
export async function cancelQuotePlayer(gameId, roundId, questionId, playerId, wholeTeam = false) {
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
            cancelQuotePlayerTransaction(transaction, gameId, roundId, questionId, playerId, wholeTeam)
        );

        console.log(`Player ${playerId} was canceled successfully.`);
    } catch (error) {
        console.error("There was an error adding a canceled player:", error);
        throw error;
    }
}

export const cancelQuotePlayerTransaction = async (
    transaction,
    gameId,
    roundId,
    questionId,
    playerId,
    wholeTeam = false
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
        updatePlayerStatusTransaction(transaction, gameId, playerId, PlayerStatus.WRONG),
        addWrongAnswerSoundToQueueTransaction(transaction, gameId),
        // updateTimerStateTransaction(transaction, gameId, TimerStatus.RESET)
    ])
}


/* ==================================================================================================== */
export async function handleQuoteCountdownEnd(gameId, roundId, questionId) {
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
            handleQuoteCountdownEndTransaction(transaction, gameId, roundId, questionId)
        )
        console.log("Quote countdown end handled successfully.");
    } catch (error) {
        console.error("There was an error handling the quote countdown end:", error);
        throw error;
    }
}

export const handleQuoteCountdownEndTransaction = async (
    transaction,
    gameId,
    roundId,
    questionId
) => {

    const questionPlayersRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId, 'realtime', 'players')
    const { buzzed } = await getDocDataTransaction(transaction, questionPlayersRef)

    if (buzzed.length === 0)
        await updateTimerStateTransaction(transaction, gameId, TimerStatus.RESET)
    else
        await cancelQuotePlayerTransaction(transaction, gameId, roundId, questionId, buzzed[0])
}

/* ==================================================================================================== */
export const resetQuoteQuestionTransaction = async (
    transaction,
    gameId,
    roundId,
    questionId
) => {
    const baseQuestionRef = doc(QUESTIONS_COLLECTION_REF, questionId)
    const baseQuestion = await getDocDataTransaction(transaction, baseQuestionRef)
    const { toGuess } = baseQuestion.details

    const gameQuestionPlayersRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId, 'realtime', 'players')
    transaction.set(gameQuestionPlayersRef, {
        buzzed: [],
        canceled: []
    })

    const initialRevealed = toGuess.reduce((acc, elem) => {
        acc[elem] = {}
        return acc
    }, {})
    if (toGuess.includes('quote')) {
        const { quoteParts } = baseQuestion.details
        initialRevealed['quote'] = quoteParts.reduce((acc, _, idx) => {
            acc[idx] = {}
            return acc
        }, {})
    }
    const gameQuestionRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId)
    transaction.update(gameQuestionRef, {
        revealed: initialRevealed
    })
}