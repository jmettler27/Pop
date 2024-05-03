"use server";

import { GAMES_COLLECTION_REF, QUESTIONS_COLLECTION_REF } from '@/lib/firebase/firestore';
import { db } from '@/lib/firebase/firebase'
import { doc, runTransaction, serverTimestamp, updateDoc, writeBatch, } from 'firebase/firestore'

import { getDocData, getDocDataTransaction } from './utils';
import { resetProgressiveCluesRealtimeTransaction } from './question/progressive_clues';
import { resetRiddleQuestionTransaction } from './question/riddle';
import { resetEnumQuestionTransaction } from './question/enum';
import { resetOddOneOutQuestionTransaction } from './question/odd_one_out';
import { resetMCQTransaction } from './question/mcq';
import { resetMatchingQuestionTransaction } from './question/matching';
import { resetQuoteQuestionTransaction } from './question/quote';

import { READY_COUNTDOWN_SECONDS } from '@/lib/utils/time';
import { DEFAULT_THINKING_TIME_SECONDS } from '@/lib/utils/question/question';
import { QUESTION_TYPES } from '@/lib/utils/question_types';

/* ==================================================================================================== */
// READ
export async function getQuestionData(questionId) {
    return getDocData('questions', questionId);
}

// REFACTOR: (questionPath, fieldsToUpdate)
// WRITE
export async function updateQuestionFields(gameId, roundId, questionId, fieldsToUpdate) {
    const questionRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId)
    const updateObject = { ...fieldsToUpdate }

    await updateDoc(questionRef, updateObject)
    console.log(`Game ${gameId}, Round ${roundId}, Question ${questionId}:`, fieldsToUpdate)
}


// WRITE
export async function updateQuestionWinner(gameId, roundId, questionId, playerId, teamId) {
    await updateQuestionFields(gameId, roundId, questionId, {
        winner: {
            playerId: playerId,
            teamId: teamId
        }
    })
}

/* ==================================================================================================== */

// Reset question
// REFACTOR: (questionPath, questionType)
export async function resetQuestion(gameId, roundId, questionId, questionType = null) {
    if (!gameId) {
        throw new Error("No game ID has been provided!");
    }
    if (!roundId) {
        throw new Error("No round ID has been provided!");
    }
    if (!questionId) {
        throw new Error("No question ID has been provided!");
    }
    if (questionType && !QUESTION_TYPES.includes(questionType)) {
        throw new Error(`Invalid question type provided: ${questionType}`);
    }

    try {
        await runTransaction(db, transaction =>
            resetQuestionTransaction(transaction, gameId, roundId, questionId, questionType)
        )
        console.log("Question resetted successfully.");
    }
    catch (error) {
        console.error("There was an error resetting the question:", error);
        throw error;
    }
}

export const resetQuestionTransaction = async (
    transaction,
    gameId,
    roundId,
    questionId,
    questionType = null
) => {
    const type = questionType || (await getDocDataTransaction(transaction, doc(QUESTIONS_COLLECTION_REF, questionId))).type
    console.log(`Resetting question ${questionId} of type ${type}...`)

    switch (type) {
        case 'progressive_clues':
            await resetProgressiveCluesRealtimeTransaction(transaction, gameId, roundId, questionId)
        case 'image':
        case 'blindtest':
        case 'emoji':
            await resetRiddleQuestionTransaction(transaction, gameId, roundId, questionId)
            break
        case 'quote':
            await resetQuoteQuestionTransaction(transaction, gameId, roundId, questionId)
            break
        case 'enum':
            await resetEnumQuestionTransaction(transaction, gameId, roundId, questionId)
            break
        case 'odd_one_out':
            await resetOddOneOutQuestionTransaction(transaction, gameId, roundId, questionId)
            break
        case 'matching':
            await resetMatchingQuestionTransaction(transaction, gameId, roundId, questionId)
            break
        case 'mcq':
            await resetMCQTransaction(transaction, gameId, roundId, questionId)
            break
    }

    const timerDocRef = doc(GAMES_COLLECTION_REF, gameId, 'realtime', 'timer')
    transaction.update(timerDocRef, {
        status: 'resetted',
        duration: DEFAULT_THINKING_TIME_SECONDS[type],
        forward: false
    })
}

/* ==================================================================================================== */
// End question
export async function endQuestion(gameId, roundId, questionId) {
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
        const batch = writeBatch(db)

        const gameDocRef = doc(GAMES_COLLECTION_REF, gameId)
        batch.update(gameDocRef, {
            status: 'question_end'
        })

        const realtimeDocRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId)
        batch.update(realtimeDocRef, {
            dateEnd: serverTimestamp()
        })

        const timerDocRef = doc(GAMES_COLLECTION_REF, gameId, 'realtime', 'timer')
        batch.update(timerDocRef, {
            status: 'resetted',
            duration: READY_COUNTDOWN_SECONDS,
            forward: false
        })

        await batch.commit()
    } catch (error) {
        console.error("There was an error ending the question:", error);
        throw error;
    }
}
