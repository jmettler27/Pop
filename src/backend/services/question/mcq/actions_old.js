"use server";

import { MCQQuestion } from '@/backend/models/questions/MCQ';

import { GAMES_COLLECTION_REF, QUESTIONS_COLLECTION_REF } from '@/backend/firebase/firestore';
import { firestore } from '@/backend/firebase/firebase'
import {
    collection,
    query,
    where,
    getDocs,
    doc,
    runTransaction,
    writeBatch
} from 'firebase/firestore'

import { addSoundTransaction, addWrongAnswerSoundToQueueTransaction } from '@/backend/services/sound/sounds';
import { getDocDataTransaction } from '@/backend/services/utils';
import { endQuestionTransaction } from '@/backend/services/question/actions';
import { increaseRoundTeamScoreTransaction } from '@/backend/services/scoring/scores';
import { PlayerStatus } from '@/backend/models/users/Player';

/* ====================================================================================================== */
export async function selectMCQChoice(gameId, roundId, questionId, playerId, teamId, choiceIdx) {
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
    if (choiceIdx < 0 || choiceIdx >= MCQQuestion.CHOICES.length) {
        throw new Error("Invalid choice!");
    }

    try {
        await runTransaction(firestore, transaction =>
            selectMCQChoiceTransaction(transaction, gameId, roundId, questionId, playerId, teamId, choiceIdx)
        )
        console.log("Option submitted successfully!")
    } catch (error) {
        console.error("There was an error handling the choice of the player:", error);
        throw error;
    }
}

const selectMCQChoiceTransaction = async (
    transaction,
    gameId,
    roundId,
    questionId,
    playerId,
    teamId,
    choiceIdx
) => {
    const playersCollectionRef = collection(GAMES_COLLECTION_REF, gameId, 'players')
    const choosersSnapshot = await getDocs(query(playersCollectionRef, where('teamId', '==', teamId)))

    const baseQuestionRef = doc(QUESTIONS_COLLECTION_REF, questionId)
    const roundRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId)

    const [baseQuestion, roundData] = await Promise.all([
        getDocDataTransaction(transaction, baseQuestionRef),
        getDocDataTransaction(transaction, roundRef),
    ])

    const { answerIdx } = baseQuestion.details
    const correct = choiceIdx === answerIdx
    const reward = correct ? roundData.rewardsPerQuestion : 0
    await increaseRoundTeamScoreTransaction(transaction, gameId, roundId, questionId, teamId, reward)

    for (const chooserDoc of choosersSnapshot.docs) {
        transaction.update(chooserDoc.ref, { status: PlayerStatus.READY })
    }

    const gameQuestionRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId)
    transaction.update(gameQuestionRef, { playerId, choiceIdx, reward, correct, })

    await addSoundTransaction(transaction, gameId, correct ? 'Anime wow' : 'hysterical5')
    await endQuestionTransaction(transaction, gameId, roundId, questionId)
}

/* ====================================================================================================== */
export async function handleMCQCountdownEnd(gameId, roundId, questionId) {
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
            handleMCQCountdownEndTransaction(transaction, gameId, roundId, questionId)
        )
        console.log("MCQ countdown end successfully handled.")
    } catch (error) {
        console.error("There was an error handling the MCQ countdown end:", error);
        throw error;
    }
}

export const handleMCQCountdownEndTransaction = async (
    transaction,
    gameId,
    roundId,
    questionId
) => {
    const playersCollectionRef = collection(GAMES_COLLECTION_REF, gameId, 'players')
    const choosersSnapshot = await getDocs(query(playersCollectionRef, where('teamId', '==', teamId)))

    const gameQuestionRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId)

    const correct = false
    const reward = 0
    await increaseRoundTeamScoreTransaction(transaction, gameId, roundId, questionId, teamId, reward)
    transaction.update(gameQuestionRef, { playerId, choiceIdx, reward, correct, })

    for (const chooserDoc of choosersSnapshot.docs) {
        transaction.update(chooserDoc.ref, { status: PlayerStatus.READY })
    }
    await addWrongAnswerSoundToQueueTransaction(transaction, gameId)
    await endQuestion(gameId, roundId, questionId)
}

/* ====================================================================================================== */
export async function resetMCQ(gameId, roundId, questionId) {
    const batch = writeBatch(firestore)

    // updateQuestionWinner(gameId, roundId, questionId, null)
    const gameQuestionRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId)
    batch.set(gameQuestionRef, {})
    batch.update(gameQuestionRef, {
        playerId: null,
        teamId: null,
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
    const gameQuestionRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId)
    transaction.update(gameQuestionRef, {
        playerId: null,
        teamId: null,
        reward: null,
        correct: null
    })
}