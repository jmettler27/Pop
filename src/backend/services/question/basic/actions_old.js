"use server";

import { GAMES_COLLECTION_REF } from '@/backend/firebase/firestore';
import { firestore } from '@/backend/firebase/firebase'
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

import { addSoundTransaction, addWrongAnswerSoundToQueueTransaction } from '@/backend/services/sound/sounds';
import { getDocDataTransaction } from '@/backend/services/utils';
import { endQuestionTransaction } from '@/backend/services/question/actions';
import { increaseRoundTeamScoreTransaction } from '@/backend/services/scoring/scores';

import { PlayerStatus } from '@/backend/models/users/Player';
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
        transaction.update(playerDoc.ref, { status: PlayerStatus.READY })
    }

    const gameQuestionRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId)
    transaction.update(gameQuestionRef, { teamId, reward, correct, })

    await addSoundTransaction(transaction, gameId, correct ? 'Anime wow' : 'hysterical5')
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
        console.log("BasicQuestion countdown end successfully handled.")
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

    const gameQuestionRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId)
    transaction.update(gameQuestionRef, {
        correct: false,
    })
    for (const playerDoc of playersSnapshot.docs) {
        transaction.update(playerDoc.ref, { status: PlayerStatus.READY })
    }

    await addWrongAnswerSoundToQueueTransaction(transaction, gameId)
    await endQuestion(gameId, roundId, questionId)
}

/* ====================================================================================================== */
export async function resetBasicQuestion(gameId, roundId, questionId) {
    const batch = writeBatch(firestore)

    const gameQuestionRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId)
    batch.set(gameQuestionRef, {})
    batch.update(gameQuestionRef, {
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
    const gameQuestionRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId)
    // transaction.set(gameQuestionRef, {})
    transaction.update(gameQuestionRef, {
        teamId: null,
        correct: null
    })
}