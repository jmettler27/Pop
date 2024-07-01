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
import { firestore } from '@/lib/firebase/firebase';

export async function getRoundData(gameId, roundId) {
    return getDocData('games', gameId, 'rounds', roundId);
}


/* ==================================================================================================== */
export async function updateRoundFields(gameId, roundId, fieldsToUpdate) {
    const roundRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId)
    const updateObject = { ...fieldsToUpdate }

    await updateDoc(roundRef, updateObject)
    console.log(`Game ${gameId}, Round ${roundId}:`, fieldsToUpdate)
}

/* ============================================================================================== */
export async function resetAllRounds(gameId) {
    if (!gameId) {
        throw new Error("No game ID has been provided!");
    }
    try {
        await runTransaction(firestore, transaction =>
            resetAllRoundsTransaction(transaction, gameId)
        )
        console.log("All rounds reset successfully.");
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
    const roundsSnapshot = await getDocs(query(roundsCollectionRef))
    for (const roundDoc of roundsSnapshot.docs) {
        if (roundDoc.data().type === 'finale') {
            await resetFinaleRound(gameId, roundDoc.id)
            continue;
        }
        await resetRoundTransaction(transaction, gameId, roundDoc.id)
    }
}

/* ============================================================================================== */
export async function resetRoundInfo(gameId, roundId) {
    await updateRoundFields(gameId, roundId, {
        currentQuestionIdx: 0,
        dateEnd: null,
        dateStart: null,
        order: null,
    })
}

/* ============================================================================================== */
export async function resetRound(gameId, roundId) {
    if (!gameId) {
        throw new Error("No game ID has been provided!");
    }
    if (!roundId) {
        throw new Error("No round ID has been provided!");
    }

    try {
        await runTransaction(firestore, transaction =>
            resetRoundTransaction(transaction, gameId, roundId)
        )
        console.log(`Round ${roundId} reset successfully.`);
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
    const questionsSnapshot = await getDocs(query(questionsCollectionRef))

    const initTeamRoundScores = await getInitTeamScores(gameId)

    for (const questionDoc of questionsSnapshot.docs) {
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