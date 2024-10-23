"use server";

import { MCQ_CHOICES, MCQ_OPTIONS, CONDITIONAL_MCQ_OPTION_TO_SOUND } from '@/lib/utils/question/mcq';

import { GAMES_COLLECTION_REF, QUESTIONS_COLLECTION_REF } from '@/lib/firebase/firestore';
import { firestore } from '@/lib/firebase/firebase'
import {
    collection,
    query,
    where,
    getDocs,
    doc,
    updateDoc,
    runTransaction,
    writeBatch
} from 'firebase/firestore'

import { addSoundEffectTransaction, addWrongAnswerSoundToQueueTransaction } from '@/app/(game)/lib/sounds';
import { getDocDataTransaction } from '@/app/(game)/lib/utils';
import { endQuestionTransaction } from '@/app/(game)/lib/question';
import { increaseRoundTeamScoreTransaction } from '@/app/(game)/lib/scores';

export async function selectConditionalMCQOption(gameId, roundId, questionId, playerId, optionIdx) {
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

    try {
        await runTransaction(firestore, transaction =>
            selectConditionalMCQOptionTransaction(transaction, gameId, roundId, questionId, playerId, optionIdx)
        )
        console.log("Option submitted successfully!")
    }
    catch (error) {
        console.error("There was an error handling the choice of the player:", error);
        throw error;
    }
}



const selectConditionalMCQOptionTransaction = async (
    transaction,
    gameId,
    roundId,
    questionId,
    playerId,
    optionIdx
) => {
    const option = MCQ_OPTIONS[optionIdx]

    const questionRealtimeRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId)
    await transaction.update(questionRealtimeRef, {
        playerId,
        option,
    })

    await addSoundEffectTransaction(transaction, gameId, CONDITIONAL_MCQ_OPTION_TO_SOUND[option])
}

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
    if (choiceIdx < 0 || choiceIdx >= MCQ_CHOICES.length) {
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

    const questionRef = doc(QUESTIONS_COLLECTION_REF, questionId)
    const roundRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId)
    const questionRealtimeRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId)

    const [questionData, roundData, questionRealtimeData] = await Promise.all([
        getDocDataTransaction(transaction, questionRef),
        getDocDataTransaction(transaction, roundRef),
        getDocDataTransaction(transaction, questionRealtimeRef),
    ])

    const { subtype, answerIdx } = questionData.details
    const correct = choiceIdx === answerIdx
    const reward = subtype === 'immediate' ? (correct ? roundData.rewardsPerQuestion : 0) :
        subtype === 'conditional' && correct ? roundData.rewardsPerQuestion[questionRealtimeData.option] : 0;
    await increaseRoundTeamScoreTransaction(transaction, gameId, roundId, questionId, teamId, reward)

    for (const chooserDoc of choosersSnapshot.docs) {
        transaction.update(chooserDoc.ref, { status: 'ready' })
    }

    transaction.update(questionRealtimeRef, { playerId, choiceIdx, reward, correct, })

    await addSoundEffectTransaction(transaction, gameId, correct ? 'Anime wow' : 'hysterical5')
    await endQuestionTransaction(transaction, gameId, roundId, questionId)
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
        await runTransaction(firestore, transaction =>
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
    const choosersSnapshot = await getDocs(query(playersCollectionRef, where('teamId', '==', teamId)))

    const roundRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId)
    const questionRealtimeRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId)

    const [roundData, questionRealtimeData] = await Promise.all([
        getDocDataTransaction(transaction, roundRef),
        getDocDataTransaction(transaction, questionRealtimeRef),
    ])

    const reward = correct ? roundData.rewardsPerQuestion[questionRealtimeData.option] : 0
    await increaseRoundTeamScoreTransaction(transaction, gameId, roundId, questionId, teamId, reward)
    transaction.update(questionRealtimeRef, { playerId, reward, correct, })

    for (const chooserDoc of choosersSnapshot.docs) {
        transaction.update(chooserDoc.ref, { status: 'ready' })
    }
    await addSoundEffectTransaction(transaction, gameId, correct ? 'Anime wow' : 'hysterical5')
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
        console.log("MCQ countdown ended successfully.")
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

    const questionRealtimeRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId)

    const correct = false
    const reward = 0
    await increaseRoundTeamScoreTransaction(transaction, gameId, roundId, questionId, teamId, reward)
    transaction.update(questionRealtimeRef, { playerId, choiceIdx, reward, correct, })

    for (const chooserDoc of choosersSnapshot.docs) {
        transaction.update(chooserDoc.ref, { status: 'ready' })
    }
    await addWrongAnswerSoundToQueueTransaction(transaction, gameId)
    await endQuestion(gameId, roundId, questionId)
}

/* ====================================================================================================== */
export async function resetMCQ(gameId, roundId, questionId) {
    const batch = writeBatch(firestore)

    // updateQuestionWinner(gameId, roundId, questionId, null)
    const questionRealtimeRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId)
    batch.set(questionRealtimeRef, {})
    batch.update(questionRealtimeRef, {
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
    const questionRealtimeRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId)
    transaction.update(questionRealtimeRef, {
        playerId: null,
        teamId: null,
        option: null,
        reward: null,
        correct: null
    })
}