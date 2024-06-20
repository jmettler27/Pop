"use server";

import { GAMES_COLLECTION_REF, QUESTIONS_COLLECTION_REF } from '@/lib/firebase/firestore';
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

import { addSoundToQueueTransaction, addWrongAnswerSoundToQueueTransaction } from '@/app/(game)/lib/sounds';
import { getDocDataTransaction } from '@/app/(game)/lib/utils';
import { endQuestionTransaction } from '../question';

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
        console.log("Option submitted successfully!")
    } catch (error) {
        console.error("There was an error handling the hide answer:", error);
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
    const q = query(playersCollectionRef, where('teamId', '==', teamId))
    const querySnapshot = await getDocs(q)

    const roundDocRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId)
    const realtimeDocRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId)
    const roundScoresRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'realtime', 'scores')

    const [roundData, roundScoresData] = await Promise.all([
        getDocDataTransaction(transaction, roundDocRef),
        getDocDataTransaction(transaction, roundScoresRef)
    ])

    const { scores: currentRoundScores, scoresProgress: currentRoundProgress } = roundScoresData

    const reward = correct ? roundData.rewardsPerQuestion : 0
    transaction.update(realtimeDocRef, {
        teamId,
        reward,
        correct,
        dateEnd: serverTimestamp()
    })

    const newRoundProgress = {}
    const teamsCollectionRef = collection(GAMES_COLLECTION_REF, gameId, 'teams')
    const teamsQuerySnapshot = await getDocs(query(teamsCollectionRef))
    for (const teamDoc of teamsQuerySnapshot.docs) {
        newRoundProgress[teamDoc.id] = {
            ...currentRoundProgress[teamDoc.id],
            [questionId]: currentRoundScores[teamDoc.id] + (teamDoc.id === teamId ? reward : 0)
        }
    }
    transaction.update(roundScoresRef, {
        [`scores.${teamId}`]: increment(reward),
        scoresProgress: newRoundProgress
    })

    for (const playerDoc of querySnapshot.docs) {
        transaction.update(playerDoc.ref, { status: 'ready' })
    }

    await addSoundToQueueTransaction(transaction, gameId, correct ? 'Anime wow' : 'hysterical5')

    // End the question
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
    const q = query(playersCollectionRef, where('teamId', '==', teamId))
    const querySnapshot = await getDocs(q)

    const realtimeDocRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId)
    const roundScoresRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'realtime', 'scores')

    const roundScoresData = await getDocDataTransaction(transaction, roundScoresRef)

    const { scores: currentRoundScores, scoresProgress: currentRoundProgress } = roundScoresData

    transaction.update(realtimeDocRef, {
        correct: false,
        dateEnd: serverTimestamp()
    })

    const newRoundProgress = {}
    const teamsCollectionRef = collection(GAMES_COLLECTION_REF, gameId, 'teams')
    const teamsQuerySnapshot = await getDocs(query(teamsCollectionRef))
    for (const teamDoc of teamsQuerySnapshot.docs) {
        newRoundProgress[teamDoc.id] = {
            ...currentRoundProgress[teamDoc.id],
            [questionId]: currentRoundScores[teamDoc.id]
        }
    }
    transaction.update(roundScoresRef, {
        scoresProgress: newRoundProgress
    })

    for (const playerDoc of querySnapshot.docs) {
        transaction.update(playerDoc.ref, { status: 'ready' })
    }

    await addWrongAnswerSoundToQueueTransaction(transaction, gameId)

    // End the question
    await endQuestion(gameId, roundId, questionId)

}

/* ====================================================================================================== */
export async function resetBasicQuestion(gameId, roundId, questionId) {
    const batch = writeBatch(firestore)

    const realtimeDocRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId)
    batch.set(realtimeDocRef, {})
    batch.update(realtimeDocRef, {
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
    const realtimeDocRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId)
    transaction.set(realtimeDocRef, {})
    transaction.update(realtimeDocRef, {
        teamId: null,
        correct: null
    })
}