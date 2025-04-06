"use server";


import { NaguiQuestion } from '@/backend/models/questions/Nagui';

const NAGUI_OPTION_TO_SOUND = {
    'hide': 'quest_ce_que_laudace',
    'square': 'cest_carre',
    'duo': 'cest_lheure_du_duo'
}

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


export async function handleNaguiCountdownEnd(gameId, roundId, questionId) {
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
            handleNaguiCountdownEndTransaction(transaction, gameId, roundId, questionId)
        )
        console.log("Nagui countdown end successfully handled.")
    } catch (error) {
        console.error("There was an error handling the Nagui countdown end:", error);
        throw error;
    }
}

export const handleNaguiCountdownEndTransaction = async (
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

export async function resetNagui(gameId, roundId, questionId) {
    const batch = writeBatch(firestore)

    // updateQuestionWinner(gameId, roundId, questionId, null)
    const gameQuestionRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId)
    batch.set(gameQuestionRef, {})
    batch.update(gameQuestionRef, {
        playerId: null,
        teamId: null,
        option: null,
        reward: null,
        correct: null
    })
    await batch.commit()
}

export const resetNaguiTransaction = async (
    transaction,
    gameId,
    roundId,
    questionId
) => {
    const gameQuestionRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId)
    transaction.update(gameQuestionRef, {
        playerId: null,
        teamId: null,
        option: null,
        reward: null,
        correct: null
    })
}


/* ====================================================================================================== */


export async function selectNaguiOption(gameId, roundId, questionId, playerId, optionIdx) {
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

    if (optionIdx < 0 || optionIdx >= NaguiQuestion.OPTIONS.length) {
        throw new Error("Invalid choice!");
    }

    try {
        await runTransaction(firestore, transaction =>
            selectNaguiOptionTransaction(transaction, gameId, roundId, questionId, playerId, optionIdx)
        )
        console.log("Option submitted successfully!")
    }
    catch (error) {
        console.error("There was an error handling the choice of the player:", error);
        throw error;
    }
}

const selectNaguiOptionTransaction = async (
    transaction,
    gameId,
    roundId,
    questionId,
    playerId,
    optionIdx
) => {
    const option = NaguiQuestion.OPTIONS[optionIdx]

    const gameQuestionRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId)
    await transaction.update(gameQuestionRef, {
        playerId,
        option,
    })

    await addSoundTransaction(transaction, gameId, NAGUI_OPTION_TO_SOUND[option])
}

export async function selectNaguiChoice(gameId, roundId, questionId, playerId, teamId, choiceIdx) {
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
    if (choiceIdx < 0 || choiceIdx >= NaguiQuestion.CHOICES.length) {
        throw new Error("Invalid choice!");
    }

    try {
        await runTransaction(firestore, transaction =>
            selectNaguiChoiceTransaction(transaction, gameId, roundId, questionId, playerId, teamId, choiceIdx)
        )
        console.log("Option submitted successfully!")
    } catch (error) {
        console.error("There was an error handling the choice of the player:", error);
        throw error;
    }
}

const selectNaguiChoiceTransaction = async (
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
    const gameQuestionRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId)

    const [baseQuestion, roundData, gameQuestionData] = await Promise.all([
        getDocDataTransaction(transaction, baseQuestionRef),
        getDocDataTransaction(transaction, roundRef),
        getDocDataTransaction(transaction, gameQuestionRef),
    ])

    const { answerIdx } = baseQuestion.details
    const correct = choiceIdx === answerIdx
    const reward = correct ? roundData.rewardsPerQuestion[gameQuestionData.option] : 0;
    await increaseRoundTeamScoreTransaction(transaction, gameId, roundId, questionId, teamId, reward)

    for (const chooserDoc of choosersSnapshot.docs) {
        transaction.update(chooserDoc.ref, { status: PlayerStatus.READY })
    }

    transaction.update(gameQuestionRef, { playerId, choiceIdx, reward, correct, })

    await addSoundTransaction(transaction, gameId, correct ? 'Anime wow' : 'hysterical5')
    await endQuestionTransaction(transaction, gameId, roundId, questionId)
}

export async function handleNaguiHideAnswer(gameId, roundId, questionId, playerId, teamId, correct) {
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
            handleNaguiHideAnswerTransaction(transaction, gameId, roundId, questionId, playerId, teamId, correct)
        )
        console.log("Option submitted successfully!")
    } catch (error) {
        console.error("There was an error handling the hide answer:", error);
        throw error;
    }
}

const handleNaguiHideAnswerTransaction = async (
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
    const gameQuestionRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId)

    const [roundData, gameQuestionData] = await Promise.all([
        getDocDataTransaction(transaction, roundRef),
        getDocDataTransaction(transaction, gameQuestionRef),
    ])

    const reward = correct ? roundData.rewardsPerQuestion[gameQuestionData.option] : 0
    await increaseRoundTeamScoreTransaction(transaction, gameId, roundId, questionId, teamId, reward)
    transaction.update(gameQuestionRef, { playerId, reward, correct, })

    for (const chooserDoc of choosersSnapshot.docs) {
        transaction.update(chooserDoc.ref, { status: PlayerStatus.READY })
    }
    await addSoundTransaction(transaction, gameId, correct ? 'Anime wow' : 'hysterical5')
    await endQuestionTransaction(transaction, gameId, roundId, questionId)
}
