"use server";

import { GAMES_COLLECTION_REF, QUESTIONS_COLLECTION_REF } from '@/backend/firebase/firestore';
import { firestore } from '@/backend/firebase/firebase'
import {
    doc,
    writeBatch,
    runTransaction,
} from 'firebase/firestore'

import { getDocDataTransaction } from '@/backend/services/utils';
import { GameMatchingQuestion } from '@/backend/models/questions/Matching';

export async function handleMatchingCountdownEnd(gameId, roundId, questionId) {
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
            handleMatchingCountdownEndTransaction(transaction, gameId, roundId, questionId)
        )
        console.log("Matching countdown end handled successfully.");
    }
    catch (error) {
        console.error("There was an error handling the matching countdown end:", error);
        throw error;
    }
}

export const handleMatchingCountdownEndTransaction = async (transaction, gameId, roundId, questionId) => {
    const baseQuestionRef = doc(QUESTIONS_COLLECTION_REF, questionId)
    const correctRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId, 'realtime', 'correct')
    const incorrectRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId, 'realtime', 'incorrect')

    const [baseQuestion, correctData, incorrectData] = await Promise.all([
        getDocDataTransaction(transaction, baseQuestionRef),
        getDocDataTransaction(transaction, correctRef),
        getDocDataTransaction(transaction, incorrectRef),
    ])

    const { numCols, numRows } = baseQuestion.details

    const correctMatchIndices = correctData.correctMatches.map(obj => obj.matchIdx)
    const incorrectMatches = incorrectData.incorrectMatches.map(obj => obj.match)
    const match = GameMatchingQuestion.generateMatch(numRows, numCols, incorrectMatches, correctMatchIndices);

    await submitMatchTransaction(transaction, gameId, roundId, questionId, 'system', null, match)
}

export async function resetMatchingQuestion(gameId, roundId, questionId) {
    const batch = writeBatch(firestore)

    const chooserRef = doc(GAMES_COLLECTION_REF, gameId, 'realtime', 'states')
    batch.update(chooserRef, {
        chooserIdx: 0,
    })

    const gameQuestionRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId)
    batch.update(gameQuestionRef, {
        teamNumMistakes: {},
        canceled: [],
    })

    const correctMatchesRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId, 'realtime', 'correct')
    batch.set(correctMatchesRef, {
        correctMatches: [],
    })

    const partiallyCorrectMatchesRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId, 'realtime', 'partially_correct')
    batch.set(partiallyCorrectMatchesRef, {
        partiallyCorrectMatches: [],
    })

    const incorrectMatchesRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId, 'realtime', 'incorrect')
    batch.set(incorrectMatchesRef, {
        incorrectMatches: [],
    })

    await batch.commit()
}

export const resetMatchingQuestionTransaction = async (transaction, gameId, roundId, questionId) => {
    const chooserRef = doc(GAMES_COLLECTION_REF, gameId, 'realtime', 'states')
    transaction.update(chooserRef, {
        chooserIdx: 0,
    })

    const gameQuestionRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId)
    transaction.update(gameQuestionRef, {
        teamNumMistakes: {},
        canceled: [],
    })

    const correctMatchesRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId, 'realtime', 'correct')
    transaction.set(correctMatchesRef, {
        correctMatches: [],
    })

    const partiallyCorrectMatchesRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId, 'realtime', 'partially_correct')
    transaction.set(partiallyCorrectMatchesRef, {
        partiallyCorrectMatches: [],
    })

    const incorrectMatchesRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId, 'realtime', 'incorrect')
    transaction.set(incorrectMatchesRef, {
        incorrectMatches: [],
    })
}

/* ==================================================================================================== */

export async function submitMatch(gameId, roundId, questionId, userId, edges, match) {
    if (!gameId) {
        throw new Error("No game ID has been provided!");
    }
    if (!roundId) {
        throw new Error("No round ID has been provided!");
    }
    if (!questionId) {
        throw new Error("No question ID has been provided!");
    }
    if (!userId) {
        throw new Error("No user ID has been provided!");
    }
    if ((!edges || edges.length === 0) && (!match || match.length === 0)) {
        throw new Error("No edges nor rows have been provided!");
    }

    try {
        await runTransaction(firestore, transaction =>
            submitMatchTransaction(transaction, gameId, roundId, questionId, userId, edges, match)
        )
        console.log("Matching submission handled successfully.");
    } catch (error) {
        console.error("There was an error handling the matching submission:", error);
        throw error;
    }
}
