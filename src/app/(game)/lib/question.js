"use server";

import { GAMES_COLLECTION_REF, QUESTIONS_COLLECTION_REF } from '@/lib/firebase/firestore';
import { db } from '@/lib/firebase/firebase'
import { doc, runTransaction, serverTimestamp, updateDoc } from 'firebase/firestore'

import { getDocData, getDocDataTransaction } from './utils';
import { resetProgressiveCluesRealtimeTransaction } from './question/progressive_clues';
import { handleRiddleCountdownEndTransaction, resetRiddleQuestionTransaction } from './question/riddle';
import { endEnumQuestionTransaction, endEnumReflectionTransaction, resetEnumQuestionTransaction } from './question/enum';
import { handleOOOCountdownEndTransaction, resetOddOneOutQuestionTransaction } from './question/odd_one_out';
import { handleMCQCountdownEnd, resetMCQTransaction } from './question/mcq';
import { handleMatchingCountdownEndTransaction, resetMatchingQuestionTransaction } from './question/matching';
import { cancelQuotePlayerTransaction, resetQuoteQuestionTransaction } from './question/quote';

import { READY_COUNTDOWN_SECONDS } from '@/lib/utils/time';
import { DEFAULT_THINKING_TIME_SECONDS } from '@/lib/utils/question/question';
import { QUESTION_TYPES, isRiddle } from '@/lib/utils/question_types';

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
        await runTransaction(db, transaction =>
            endQuestionTransaction(transaction, gameId, roundId, questionId)
        )
        console.log("Question ended successfully.");
    } catch (error) {
        console.error("There was an error ending the question:", error);
        throw error;
    }
}

export const endQuestionTransaction = async (transaction, gameId, roundId, questionId) => {
    const gameDocRef = doc(GAMES_COLLECTION_REF, gameId)
    transaction.update(gameDocRef, {
        status: 'question_end'
    })

    const realtimeDocRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId)
    transaction.update(realtimeDocRef, {
        dateEnd: serverTimestamp()
    })

    const timerDocRef = doc(GAMES_COLLECTION_REF, gameId, 'realtime', 'timer')
    transaction.update(timerDocRef, {
        status: 'resetted',
        duration: READY_COUNTDOWN_SECONDS,
        forward: false
    })
}


/* ==================================================================================================== */
export async function handleQuestionActiveCountdownEnd(gameId, roundId, questionId, questionType = null) {
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
            handleQuestionActiveCountdownEndTransaction(transaction, gameId, roundId, questionId, questionType)
        )
        console.log("Question active countdown ended successfully.");
    } catch (error) {
        console.error("There was an error handling the question active countdown end:", error);
        throw error;
    }
}

const handleQuestionActiveCountdownEndTransaction = async (
    transaction,
    gameId,
    roundId,
    questionId,
    questionType = null
) => {

    const type = questionType || (await getDocDataTransaction(transaction, doc(QUESTIONS_COLLECTION_REF, questionId))).type

    console.log(`Handling question active countdown end for question ${questionId} of type ${type}...`)

    // Riddle: cancel
    // Quote: cancel
    // OOO +1, 5s countdown
    // Matching: +1, 5s cooldown
    // MCQ: end of question and 0

    if (isRiddle(type)) {
        await handleRiddleCountdownEndTransaction(transaction, gameId, roundId, questionId, type)
    } else if (type === 'quote') {
        await cancelQuotePlayerTransaction(transaction, gameId, roundId, questionId)
    } else if (type === 'odd_one_out') {
        await handleOOOCountdownEndTransaction(transaction, gameId, roundId, questionId)
    } else if (type === 'matching') {
        await handleMatchingCountdownEndTransaction(transaction, gameId, roundId, questionId)
    } else if (type === 'mcq') {
        await handleMCQCountdownEnd(transaction, gameId, roundId, questionId)
    } else if (type === 'enum') {
        const questionRef = doc(QUESTIONS_COLLECTION_REF, questionId)
        const questionData = await getDocDataTransaction(transaction, questionRef)
        const { status } = questionData
        if (status === 'reflection_active') {
            await endEnumReflectionTransaction(transaction, gameId, roundId, questionId)
        } else if (status === 'reflection_end') {
            await endEnumQuestionTransaction(transaction, gameId, roundId, questionId)
        }
    }
}
