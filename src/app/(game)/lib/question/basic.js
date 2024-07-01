"use server";

import { GAMES_COLLECTION_REF } from '@/lib/firebase/firestore';
import { firestore } from '@/lib/firebase/firebase'
import {
    collection,
    query,
    where,
    getDocs,
    doc,
    increment,
    serverTimestamp,
    runTransaction,
    writeBatch
} from 'firebase/firestore'

import { addSoundEffectTransaction, addWrongAnswerSoundToQueueTransaction } from '@/app/(game)/lib/sounds';
import { getDocDataTransaction } from '@/app/(game)/lib/utils';
import { endQuestionTransaction } from '@/app/(game)/lib/question';
import { increaseRoundTeamScoreTransaction } from '@/app/(game)/lib/scores';

/* ====================================================================================================== */
export async function handleBasicAnswer(gameId, roundId, questionId, teamId, correct) {
    if (!gameId) {
        throw new Error("No game ID has been provided!");
    }
    if (!roundId) {
        throw new Error("No round ID has been provided!");
    }
    if (!questionId) {
        throw new Error("No question ID has been provided!");
    }
    if (!teamId) {
        throw new Error("No team ID has been provided!");
    }

    try {
        await runTransaction(firestore, transaction =>
            handleBasicAnswerTransaction(transaction, gameId, roundId, questionId, teamId, correct)
        )
    } catch (error) {
        console.error("There was an error handling the basic answer:", error);
        throw error;
    }
}

const handleBasicAnswerTransaction = async (
    transaction,
    gameId,
    roundId,
    questionId,
    teamId,
    correct
) => {
    const playersCollectionRef = collection(GAMES_COLLECTION_REF, gameId, 'players')
    const playersSnapshot = await getDocs(query(playersCollectionRef, where('teamId', '==', teamId)))

    const roundRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId)
    const roundData = await getDocDataTransaction(transaction, roundRef)
    const reward = correct ? roundData.rewardsPerQuestion : 0

    await increaseRoundTeamScoreTransaction(transaction, gameId, roundId, teamId, reward)
    for (const playerDoc of playersSnapshot.docs) {
        transaction.update(playerDoc.ref, { status: 'ready' })
    }

    const questionRealtimeRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId)
    transaction.update(questionRealtimeRef, { teamId, reward, correct, })

    await addSoundEffectTransaction(transaction, gameId, correct ? 'Anime wow' : 'hysterical5')
    await endQuestionTransaction(transaction, gameId, roundId, questionId)
}

/* ====================================================================================================== */
export async function handleBasicQuestionCountdownEnd(gameId, roundId, questionId) {
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
            handleBasicQuestionCountdownEndTransaction(transaction, gameId, roundId, questionId)
        )
        console.log("BasicQuestion countdown ended successfully.")
    } catch (error) {
        console.error("There was an error handling the BasicQuestion countdown end:", error);
        throw error;
    }
}

export const handleBasicQuestionCountdownEndTransaction = async (
    transaction,
    gameId,
    roundId,
    questionId
) => {
    const playersCollectionRef = collection(GAMES_COLLECTION_REF, gameId, 'players')
    const playersSnapshot = await getDocs(query(playersCollectionRef, where('teamId', '==', teamId)))

    await increaseRoundTeamScoreTransaction(transaction, gameId, roundId, teamId, 0)

    const questionRealtimeRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId)
    transaction.update(questionRealtimeRef, {
        correct: false,
    })
    for (const playerDoc of playersSnapshot.docs) {
        transaction.update(playerDoc.ref, { status: 'ready' })
    }

    await addWrongAnswerSoundToQueueTransaction(transaction, gameId)
    await endQuestion(gameId, roundId, questionId)
}

/* ====================================================================================================== */
export async function resetBasicQuestion(gameId, roundId, questionId) {
    const batch = writeBatch(firestore)

    const questionRealtimeRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId)
    batch.set(questionRealtimeRef, {})
    batch.update(questionRealtimeRef, {
        teamId: null,
        correct: null
    })
    await batch.commit()
}

export const resetBasicQuestionTransaction = async (
    transaction,
    gameId,
    roundId,
    questionId
) => {
    const questionRealtimeRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId)
    transaction.set(questionRealtimeRef, {})
    transaction.update(questionRealtimeRef, {
        teamId: null,
        correct: null
    })
}