"use server";

import { MCQ_CHOICES, MCQ_OPTIONS } from '@/lib/utils/question/mcq';

import { GAMES_COLLECTION_REF, QUESTIONS_COLLECTION_REF } from '@/lib/firebase/firestore';
import { db } from '@/lib/firebase/firebase'
import {
    collection,
    query,
    where,
    getDocs,
    getDoc,
    doc,
    updateDoc,
    increment,
    serverTimestamp,
    runTransaction,
    writeBatch
} from 'firebase/firestore'

import { addSoundToQueueTransaction } from '@/app/(game)/lib/sounds';
import { getDocDataTransaction, updateGameStatusTransaction } from '@/app/(game)/lib/utils';

export async function handleSubmitOptionPlayer(gameId, roundId, questionId, playerId, optionIdx) {
    if (!gameId) {
        throw new Error("No game ID has been provided!");
    }
    if (!roundId) {
        throw new Error("No round ID has been provided!");
    }
    if (!questionId) {
        throw new Error("No question ID has been provided!");
    }
    if (!playerId) {
        throw new Error("No player ID has been provided!");
    }

    if (optionIdx < 0 || optionIdx >= MCQ_OPTIONS.length) {
        throw new Error("Invalid choice!");
    }

    // updateQuestionWinner(gameId, roundId, questionId, null)
    const realtimeDocRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId)
    updateDoc(realtimeDocRef, {
        playerId,
        option: MCQ_OPTIONS[optionIdx],
    })
}

/* ====================================================================================================== */
export async function handleSubmitChoicePlayer(gameId, roundId, questionId, playerId, teamId, choiceIdx) {
    if (!gameId) {
        throw new Error("No game ID has been provided!");
    }
    if (!roundId) {
        throw new Error("No round ID has been provided!");
    }
    if (!questionId) {
        throw new Error("No question ID has been provided!");
    }
    if (!playerId) {
        throw new Error("No player ID has been provided!");
    }
    if (!teamId) {
        throw new Error("No team ID has been provided!");
    }
    if (choiceIdx < 0 || choiceIdx >= MCQ_CHOICES.length) {
        throw new Error("Invalid choice!");
    }

    try {
        await runTransaction(db, transaction =>
            handleSubmitChoicePlayerTransaction(transaction, gameId, roundId, questionId, playerId, teamId, choiceIdx)
        )
        console.log("Option submitted successfully!")
    } catch (error) {
        console.error("There was an error handling the choice of the player:", error);
        throw error;
    }
}

const handleSubmitChoicePlayerTransaction = async (
    transaction,
    gameId,
    roundId,
    questionId,
    playerId,
    teamId,
    choiceIdx
) => {
    const playersCollectionRef = collection(GAMES_COLLECTION_REF, gameId, 'players')
    const q = query(playersCollectionRef, where('teamId', '==', teamId))
    const querySnapshot = await getDocs(q)

    const questionDocRef = doc(QUESTIONS_COLLECTION_REF, questionId)
    const roundDocRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId)
    const realtimeDocRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId)
    const roundScoresRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'realtime', 'scores')

    const [questionData, roundData, realtimeData, roundScoresData] = await Promise.all([
        getDocDataTransaction(transaction, questionDocRef),
        getDocDataTransaction(transaction, roundDocRef),
        getDocDataTransaction(transaction, realtimeDocRef),
        getDocDataTransaction(transaction, roundScoresRef)
    ])

    const { scores: currentRoundScores, scoresProgress: currentRoundProgress } = roundScoresData

    const correct = choiceIdx === questionData.details.answerIdx
    const reward = correct ? roundData.rewardsPerQuestion[realtimeData.option] : 0
    transaction.update(realtimeDocRef, {
        playerId,
        choiceIdx,
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
    await updateGameStatusTransaction(transaction, gameId, 'question_end')
}

/* ====================================================================================================== */
export async function handleHideAnswer(gameId, roundId, questionId, playerId, teamId, correct) {
    if (!gameId) {
        throw new Error("No game ID has been provided!");
    }
    if (!roundId) {
        throw new Error("No round ID has been provided!");
    }
    if (!questionId) {
        throw new Error("No question ID has been provided!");
    }
    if (!playerId) {
        throw new Error("No player ID has been provided!");
    }
    if (!teamId) {
        throw new Error("No team ID has been provided!");
    }

    try {
        await runTransaction(db, transaction =>
            handleHideAnswerTransaction(transaction, gameId, roundId, questionId, playerId, teamId, correct)
        )
        console.log("Option submitted successfully!")
    } catch (error) {
        console.error("There was an error handling the hide answer:", error);
        throw error;
    }
}

const handleHideAnswerTransaction = async (
    transaction,
    gameId,
    roundId,
    questionId,
    playerId,
    teamId,
    correct
) => {
    const playersCollectionRef = collection(GAMES_COLLECTION_REF, gameId, 'players')
    const q = query(playersCollectionRef, where('teamId', '==', teamId))
    const querySnapshot = await getDocs(q)

    const roundDocRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId)
    const realtimeDocRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId)
    const roundScoresRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'realtime', 'scores')

    const [roundData, realtimeData, roundScoresData] = await Promise.all([
        getDocDataTransaction(transaction, roundDocRef),
        getDocDataTransaction(transaction, realtimeDocRef),
        getDocDataTransaction(transaction, roundScoresRef)
    ])

    const { scores: currentRoundScores, scoresProgress: currentRoundProgress } = roundScoresData

    // const correct = choiceIdx === questionData.details.answerIdx
    const reward = correct ? roundData.rewardsPerQuestion[realtimeData.option] : 0
    transaction.update(realtimeDocRef, {
        playerId,
        // choiceIdx,
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
    await updateGameStatusTransaction(transaction, gameId, 'question_end')
}

/* ====================================================================================================== */
export async function resetMCQ(gameId, roundId, questionId) {
    const batch = writeBatch(db)

    // updateQuestionWinner(gameId, roundId, questionId, null)
    const realtimeDocRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId)
    batch.set(realtimeDocRef, {})
    batch.update(realtimeDocRef, {
        playerId: null,
        teamId: null,
        option: null,
        reward: null,
        correct: null
    })
    await batch.commit()
}

export const resetMCQTransaction = async (
    transaction,
    gameId,
    roundId,
    questionId
) => {
    const realtimeDocRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId)
    transaction.set(realtimeDocRef, {})
    transaction.update(realtimeDocRef, {
        playerId: null,
        teamId: null,
        option: null,
        reward: null,
        correct: null
    })
}