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

import { addSoundToQueueTransaction } from '@/app/(game)/lib/sounds';
import { getDocDataTransaction } from '@/app/(game)/lib/utils';
import { QUOTE_ELEMENTS } from '@/lib/utils/question/quote';
import { isObjectEmpty } from '@/lib/utils';
import { endQuestion } from '../question';

/**
 * When the organizer reveals an element from the quote (author, source, quote part)
 */
// TRANSACTION
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
    if (!QUOTE_ELEMENTS.includes(quoteElem)) {
        throw new Error("The quote element is not valid!");
    }
    if (quoteElem === 'quote' && quotePartIdx === null) {
        throw new Error("The quote part index is not valid!");
    }

    try {
        // transaction
        await runTransaction(db, transaction =>
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

    const questionRef = doc(QUESTIONS_COLLECTION_REF, questionId)
    const roundRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId)
    const roundScoresRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'realtime', 'scores')
    const questionRealtimeRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId)
    const questionPlayersRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId, 'realtime', 'players')

    const [questionData, roundData, roundScoresData, questionRealtimeData, questionPlayersData] = await Promise.all([
        getDocDataTransaction(transaction, questionRef),
        getDocDataTransaction(transaction, roundRef),
        getDocDataTransaction(transaction, roundScoresRef),
        getDocDataTransaction(transaction, questionRealtimeRef),
        getDocDataTransaction(transaction, questionPlayersRef)
    ])

    const playerId = questionPlayersData.buzzed[0] || null

    const { revealed } = questionRealtimeData
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

        transaction.update(playerRef, {
            status: 'correct'
        })
    }

    const { toGuess, quoteParts } = questionData.details

    const temp1 = toGuess.every(elem => newRevealed[elem] && !isObjectEmpty(newRevealed[elem]))
    const newRevealedQuote = newRevealed['quote']
    const temp2 = quoteParts.every((_, idx) => newRevealedQuote[idx] && !isObjectEmpty(newRevealedQuote[idx]))
    const allRevealed = temp1 && temp2

    transaction.update(questionRealtimeRef, {
        revealed: newRevealed
    })

    // If all revealed
    if (allRevealed) {
        transaction.update(questionRealtimeRef, {
            dateEnd: serverTimestamp(),
        })

        await endQuestion(gameId, roundId, questionId)
        await addSoundToQueueTransaction(transaction, gameId, 'Anime wow')
        return
    }
    await addSoundToQueueTransaction(transaction, gameId, playerId ? 'OUI' : 'cartoon_mystery_musical_tone_002')
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
        await runTransaction(db, transaction =>
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

    const questionRef = doc(QUESTIONS_COLLECTION_REF, questionId)
    const roundRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId)
    const roundScoresRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'realtime', 'scores')
    const questionRealtimeRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId)

    const [questionData, roundData, roundScoresData, questionRealtimeData] = await Promise.all([
        getDocDataTransaction(transaction, questionRef),
        getDocDataTransaction(transaction, roundRef),
        getDocDataTransaction(transaction, roundScoresRef),
        getDocDataTransaction(transaction, questionRealtimeRef),
    ])

    const { revealed } = questionRealtimeData
    const newRevealed = revealed

    const { toGuess, quoteParts } = questionData.details

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
    const playerRef = doc(GAMES_COLLECTION_REF, gameId, 'players', playerId)
    const playerData = await getDocDataTransaction(transaction, playerRef)
    const { teamId } = playerData
    const { rewardsPerElement: points } = roundData
    const totalPoints = points * (toGuess.length + quoteParts.length - 1)
    const { scores: currentRoundScores, scoresProgress: currentRoundProgress } = roundScoresData
    const newRoundProgress = {}
    for (const tid of Object.keys(currentRoundScores)) {
        // Add an entry whose key is questionId and value is currentRoundScores[tid
        newRoundProgress[tid] = {
            ...currentRoundProgress[tid],
            [questionId]: currentRoundScores[tid] + (tid === teamId ? totalPoints : 0)
        }
    }
    transaction.update(roundScoresRef, {
        [`scores.${teamId}`]: increment(totalPoints),
        scoresProgress: newRoundProgress
    })

    transaction.update(playerRef, {
        status: 'correct'
    })

    transaction.update(questionRealtimeRef, {
        revealed: newRevealed,
        dateEnd: serverTimestamp(),
    })

    await endQuestion(gameId, roundId, questionId)
    await addSoundToQueueTransaction(transaction, gameId, 'Anime wow')
}


/* ==================================================================================================== */
/**
 * When the organizer invalidates the answer of a player.
 */
// TRANSACTION
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
        await runTransaction(db, transaction =>
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
    const playersDocRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId, 'realtime', 'players')
    transaction.update(playersDocRef, {
        canceled: arrayUnion({
            playerId,
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
}

/* ==================================================================================================== */
export const resetQuoteQuestionTransaction = async (
    transaction,
    gameId,
    roundId,
    questionId
) => {
    const questionRef = doc(QUESTIONS_COLLECTION_REF, questionId)
    const questionData = await getDocDataTransaction(transaction, questionRef)
    const { toGuess } = questionData.details

    const questionRealtimePlayersRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId, 'realtime', 'players')
    transaction.set(questionRealtimePlayersRef, {
        buzzed: [],
        canceled: []
    })

    const initialRevealed = toGuess.reduce((acc, elem) => {
        acc[elem] = {}
        return acc
    }, {})
    if (toGuess.includes('quote')) {
        const { quoteParts } = questionData.details
        initialRevealed['quote'] = quoteParts.reduce((acc, _, idx) => {
            acc[idx] = {}
            return acc
        }, {})
    }
    const realtimeDocRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId)
    transaction.update(realtimeDocRef, {
        revealed: initialRevealed
    })
}