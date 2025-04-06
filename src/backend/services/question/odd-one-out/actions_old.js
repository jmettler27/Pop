"use server";

import { GAMES_COLLECTION_REF, QUESTIONS_COLLECTION_REF } from '@/backend/firebase/firestore';
import { firestore } from '@/backend/firebase/firebase'
import {
    doc,
    arrayUnion,
    Timestamp,
    writeBatch,
    runTransaction,
    collection,
    where,
    query,
    getDocs,
} from 'firebase/firestore'

import { switchNextChooserTransaction } from '@/backend/services/chooser/chooser'
import { addSoundTransaction } from '@/backend/services/sound/sounds';
import { getDocDataTransaction } from '@/backend/services/utils';
import { endQuestionTransaction } from '@/backend/services/question/actions';
import { updateTimerStateTransaction, updateTimerTransaction } from '@/backend/services/timer/timer';
import { decreaseGlobalTeamScoreTransaction, increaseRoundTeamScoreTransaction } from '@/backend/services/scoring/scores';

import { moveToHead } from '@/backend/utils/arrays';

import { OddOneOutQuestion } from '@/backend/models/questions/OddOneOut';
import { PlayerStatus } from '@/backend/models/users/Player';
import { TimerStatus } from '@/backend/models/Timer';

export async function selectProposal(gameId, roundId, questionId, playerId, idx) {
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

    try {
        await runTransaction(firestore, transaction =>
            selectProposalTransaction(transaction, gameId, roundId, questionId, playerId, idx)
        )
        console.log("Proposal selection handled successfully.");
    } catch (error) {
        console.error("There was an error handling the proposal click:", error);
        throw error;
    }
}
const selectProposalTransaction = async (
    transaction,
    gameId,
    roundId,
    questionId,
    playerId,
    idx
) => {
    const baseQuestionRef = doc(QUESTIONS_COLLECTION_REF, questionId)
    const chooserRef = doc(GAMES_COLLECTION_REF, gameId, 'realtime', 'states')

    const [baseQuestion, chooserData] = await Promise.all([
        getDocDataTransaction(transaction, baseQuestionRef),
        getDocDataTransaction(transaction, chooserRef)
    ])

    const { chooserOrder, chooserIdx } = chooserData
    const teamId = chooserOrder[chooserIdx]

    const playersCollectionRef = collection(GAMES_COLLECTION_REF, gameId, 'players')
    const choosersSnapshot = await getDocs(query(playersCollectionRef, where('teamId', '==', teamId)))

    const gameQuestionRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId)

    if (idx === baseQuestion.details.answerIdx) {
        // The selected proposal is the odd one one out
        const gameRef = doc(GAMES_COLLECTION_REF, gameId)
        const roundRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId)
        const [gameData, roundData] = await Promise.all([
            getDocDataTransaction(transaction, gameRef),
            getDocDataTransaction(transaction, roundRef),
        ])

        const { roundScorePolicy } = gameData
        const { mistakePenalty } = roundData

        if (roundScorePolicy === 'ranking') {
            // Increase the team's round score to 1
            await increaseRoundTeamScoreTransaction(transaction, gameId, roundId, questionId, teamId, mistakePenalty)
        } else if (roundScorePolicy === 'completion_rate') {
            // Decrease the team's global score by the penalty and increment the number of mistakes of the team in the round
            await decreaseGlobalTeamScoreTransaction(transaction, gameId, roundId, questionId, mistakePenalty, teamId)
        }

        for (const chooserDoc of choosersSnapshot.docs) {
            transaction.update(chooserDoc.ref, { status: PlayerStatus.WRONG })
        }
        // Move the "winner" to the head of the chooser list
        const newChooserOrder = moveToHead(teamId, chooserOrder)
        transaction.update(chooserRef, {
            chooserOrder: newChooserOrder
        })
        transaction.update(gameQuestionRef, {
            winner: { playerId, teamId }
        })
        await addSoundTransaction(transaction, gameId, 'hysterical5')
        await endQuestionTransaction(transaction, gameId, roundId, questionId)
    } else {
        // The select proposal is correct
        const gameQuestionData = await getDocDataTransaction(transaction, gameQuestionRef)
        const newNumClicked = gameQuestionData.selectedItems.length + 1
        if (newNumClicked === baseQuestion.details.items.length - 1) {
            // No one selected the odd one out
            await addSoundTransaction(transaction, gameId, 'zelda_secret_door')
            await endQuestionTransaction(transaction, gameId, roundId, questionId)
        } else {
            // The selected proposal is not the last remaining one
            await switchNextChooserTransaction(transaction, gameId)
            await addSoundTransaction(transaction, gameId, 'Bien')
            await updateTimerStateTransaction(transaction, gameId, TimerStatus.RESET)
        }
        for (const chooserDoc of choosersSnapshot.docs) {
            transaction.update(chooserDoc.ref, { status: PlayerStatus.IDLE })
        }
    }
    transaction.update(gameQuestionRef, {
        selectedItems: arrayUnion({
            idx,
            playerId,
            timestamp: Timestamp.now()
        })
    })
    await updateTimerTransaction(transaction, gameId, {
        authorized: false
    })
}

/* ==================================================================================================== */
export async function handleOOOCountdownEnd(gameId, roundId, questionId) {
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
            handleOOOCountdownEndTransaction(transaction, gameId, roundId, questionId)
        )
        console.log("Odd one out countdown end handled successfully.");
    } catch (error) {
        console.error("There was an error handling the odd one out countdown end:", error);
        throw error;
    }
}

export const handleOOOCountdownEndTransaction = async (
    transaction,
    gameId,
    roundId,
    questionId
) => {
    const gameQuestionRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId)
    const gameQuestionData = await getDocDataTransaction(transaction, gameQuestionRef)

    const { selectedItems } = gameQuestionData
    const selectedIdxsSet = new Set(selectedItems.map(item => item.idx));

    const remainingItems = [];
    for (let i = 0; i < OddOneOutQuestion.MAX_NUM_ITEMS; i++) {
        if (!selectedIdxsSet.has(i)) {
            remainingItems.push(i);
        }
    }

    const randomIdx = remainingItems[Math.floor(Math.random() * remainingItems.length)];
    await selectProposalTransaction(transaction, gameId, roundId, questionId, 'system', randomIdx)
}

export async function resetOddOneOutQuestion(gameId, roundId, questionId) {
    const batch = writeBatch(firestore)

    const chooserRef = doc(GAMES_COLLECTION_REF, gameId, 'realtime', 'states')
    batch.update(chooserRef, {
        chooserIdx: 0,
    })

    const gameQuestionRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId)
    batch.update(gameQuestionRef, {
        winner: null,
        selectedItems: [],
    })

    await batch.commit()
}

export const resetOddOneOutQuestionTransaction = async (
    transaction,
    gameId,
    roundId,
    questionId
) => {
    const chooserRef = doc(GAMES_COLLECTION_REF, gameId, 'realtime', 'states')
    transaction.update(chooserRef, {
        chooserIdx: 0,
    })

    const gameQuestionRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId)
    transaction.update(gameQuestionRef, {
        winner: null,
        selectedItems: [],
    })
}