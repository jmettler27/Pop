"use server";

import { GAMES_COLLECTION_REF } from '@/lib/firebase/firestore';
import {
    collection,
    query,
    getDocs,
    doc,
    updateDoc,
    runTransaction,
} from 'firebase/firestore'

import { resetQuestion } from '@/app/(game)/lib/question';
import { getInitTeamScores } from '@/app/(game)/lib/scores';
import { getDocData } from '@/app/(game)/lib/utils';
import { resetFinaleRound } from '@/app/(game)/lib/question/finale';
import { db } from '@/lib/firebase/firebase';

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
    if (!gameId) {
        throw new Error("No game ID has been provided!");
    }
    try {
        await runTransaction(db, transaction =>
            resetAllRoundsTransaction(transaction, gameId)
        )
        console.log("All rounds resetted successfully.");
    } catch (error) {
        console.error("There was an error resetting all rounds:", error);
        throw error;
    }
}

export const resetAllRoundsTransaction = async (
    transaction,
    gameId
) => {
    const roundsCollectionRef = collection(GAMES_COLLECTION_REF, gameId, 'rounds')
    const querySnapshot = await getDocs(query(roundsCollectionRef))
    for (const roundDoc of querySnapshot.docs) {
        if (roundDoc.data().type === 'finale') {
            // batched write
            await resetFinaleRound(gameId, roundDoc.id)
            continue;
        }

        // Reset round document
        await resetRoundTransaction(transaction, gameId, roundDoc.id)
    }
}

// WRITE
export async function resetRoundInfo(gameId, roundId) {
    await updateRoundFields(gameId, roundId, {
        currentQuestionIdx: 0,
        dateEnd: null,
        dateStart: null,
        order: null,
    })
}

// TRANSACTION
export async function resetRound(gameId, roundId) {
    if (!gameId) {
        throw new Error("No game ID has been provided!");
    }
    if (!roundId) {
        throw new Error("No round ID has been provided!");
    }

    try {
        await runTransaction(db, transaction =>
            resetRoundTransaction(transaction, gameId, roundId)
        )
        console.log(`Round ${roundId} resetted successfully.`);
    }
    catch (error) {
        console.error("There was an error resetting the round:", error);
        throw error;
    }
}

const resetRoundTransaction = async (
    transaction,
    gameId,
    roundId
) => {
    const questionsCollectionRef = collection(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions')
    const questionsQuerySnapshot = await getDocs(query(questionsCollectionRef))

    const initTeamRoundScores = await getInitTeamScores(gameId)

    for (const questionDoc of questionsQuerySnapshot.docs) {
        await resetQuestion(gameId, roundId, questionDoc.id, questionDoc.data().type)
    }

    const roundScoresRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'realtime', 'scores')
    transaction.update(roundScoresRef, {
        scores: initTeamRoundScores,
        scoresProgress: {},
        teamsScoresSequences: {},
        roundSortedTeams: [],
        gameSortedTeams: []
    })


    const roundRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId)
    transaction.update(roundRef, {
        currentQuestionIdx: 0,
        dateEnd: null,
        dateStart: null,
        order: null,
    })

}