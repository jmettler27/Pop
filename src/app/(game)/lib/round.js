"use server";

import { GAMES_COLLECTION_REF } from '@/lib/firebase/firestore';
import {
    collection,
    query,
    getDocs,
    doc,
    updateDoc,
} from 'firebase/firestore'

import { resetQuestion } from '@/app/(game)/lib/question';
import { initRoundScores } from '@/app/(game)/lib/scores';
import { getDocData } from '@/app/(game)/lib/utils';
import { resetFinaleRound } from '@/app/(game)/lib/question/finale';

// READ
export async function getRoundData(gameId, roundId) {
    return getDocData('games', gameId, 'rounds', roundId);
}


/* ==================================================================================================== */
// Round
// WRITE
export async function updateRoundFields(gameId, roundId, fieldsToUpdate) {
    const roundRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId)
    const updateObject = { ...fieldsToUpdate }

    await updateDoc(roundRef, updateObject)
    console.log(`Game ${gameId}, Round ${roundId}:`, fieldsToUpdate)
}

/* ============================================================================================== */
// Reset round
// BATCHED WRITE
export async function resetAllRounds(gameId) {
    const roundsCollectionRef = collection(GAMES_COLLECTION_REF, gameId, 'rounds')
    const querySnapshot = await getDocs(query(roundsCollectionRef))
    for (const roundDoc of querySnapshot.docs) {
        if (roundDoc.data().type === 'finale') {
            // batched write
            resetFinaleRound(gameId, roundDoc.id)
            continue;
        }

        // Reset round document
        await resetRound(gameId, roundDoc.id)
    }
}

// WRITE
export async function resetRoundInfo(gameId, roundId) {
    await updateRoundFields(gameId, roundId, {
        dateEnd: null,
        dateStart: null,
        order: null,
    })
}

// TRANSACTION
async function resetRound(gameId, roundId) {
    // WRITE
    await resetRoundInfo(gameId, roundId)

    // TRANSACTION
    await initRoundScores(gameId, roundId)

    // BATCHED WRITE
    await resetAllRoundQuestions(gameId, roundId)

    console.log(`Game ${gameId}, Round ${roundId} resetted`)
}

// BATCHED WRITE
async function resetAllRoundQuestions(gameId, roundId) {
    // Reset questions collection
    const questionsCollectionRef = collection(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions')
    const querySnapshot = await getDocs(query(questionsCollectionRef))
    for (const questionDoc of querySnapshot.docs) {
        await resetQuestion(gameId, roundId, questionDoc.id, questionDoc.data().type)
    }
}