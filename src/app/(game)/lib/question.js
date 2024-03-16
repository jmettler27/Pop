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
export async function resetQuestion(gameId, roundId, questionId) {
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
            resetQuestionTransaction(transaction, gameId, roundId, questionId)
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
    questionId
) => {
    const questionDocRef = doc(QUESTIONS_COLLECTION_REF, questionId)
    const questionData = await getDocDataTransaction(transaction, questionDocRef)

    const type = questionData.type
    console.log(`Resetting question ${questionId} of type ${type}...`)

    switch (type) {
        case 'progressive_clues':
            await resetProgressiveCluesRealtimeTransaction(transaction, gameId, roundId, questionId)
        case 'image':
        case 'blindtest':
        case 'emoji':
            await resetRiddleQuestionTransaction(transaction, gameId, roundId, questionId)
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
}

/* ==================================================================================================== */
// End question
export async function organizerEndQuestion(gameId, roundId, questionId) {
    if (!gameId) {
        throw new Error("No game ID has been provided!");
    }
    if (!roundId) {
        throw new Error("No round ID has been provided!");
    }
    if (!questionId) {
        throw new Error("No question ID has been provided!");
    }
    const batch = writeBatch(db)

    const gameDocRef = doc(GAMES_COLLECTION_REF, gameId)
    batch.update(gameDocRef, {
        status: 'question_end'
    })

    const realtimeDocRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId)
    batch.update(realtimeDocRef, {
        dateEnd: serverTimestamp()
    })

    await batch.commit()
}