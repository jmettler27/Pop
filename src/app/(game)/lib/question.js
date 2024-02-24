"use server";

import { GAMES_COLLECTION_REF } from '@/lib/firebase/firestore';
import { db } from '@/lib/firebase/firebase'
import { doc, serverTimestamp, updateDoc, writeBatch, } from 'firebase/firestore'

import { getDocData } from './utils';
import { initProgressiveCluesQuestionRealtime } from './question/progressive_clues';
import { resetRiddleQuestion } from './question/riddle';
import { resetEnumQuestion as resetEnumQuestion } from './question/enum';
import { resetOddOneOutQuestion } from './question/odd_one_out';
import { resetMCQ } from './question/mcq';
import { resetMatchingQuestion } from './question/matching';

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
    const type = questionType ? questionType : (await getQuestionData(questionId)).type
    console.log(`Resetting question ${questionId} of type ${type}...`)

    switch (type) {
        case 'progressive_clues':
            initProgressiveCluesQuestionRealtime(gameId, roundId, questionId)
        case 'image':
        case 'blindtest':
        case 'emoji':
            await resetRiddleQuestion(gameId, roundId, questionId)
            break
        case 'enum':
            await resetEnumQuestion(gameId, roundId, questionId)
            break
        case 'odd_one_out':
            await resetOddOneOutQuestion(gameId, roundId, questionId)
            break
        case 'matching':
            await resetMatchingQuestion(gameId, roundId, questionId)
            break
        case 'mcq':
            await resetMCQ(gameId, roundId, questionId)
            break
    }
}

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