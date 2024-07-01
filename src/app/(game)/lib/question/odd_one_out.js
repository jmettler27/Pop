"use server";

import { GAMES_COLLECTION_REF, QUESTIONS_COLLECTION_REF } from '@/lib/firebase/firestore';
import { firestore } from '@/lib/firebase/firebase'
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

import { switchNextChooserTransaction } from '@/app/(game)/lib/chooser'
import { addSoundEffectTransaction } from '@/app/(game)/lib/sounds';
import { getDocDataTransaction } from '@/app/(game)/lib/utils';
import { endQuestionTransaction } from '@/app/(game)/lib/question';
import { updateTimerStateTransaction, updateTimerTransaction } from '@/app/(game)/lib/timer';
import { increaseRoundTeamScoreTransaction } from '@/app/(game)/lib/scores';

import { moveToHead } from '@/lib/utils/arrays';
import { OOO_ITEMS_LENGTH } from '@/lib/utils/question/odd_one_out';


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
    const questionRef = doc(QUESTIONS_COLLECTION_REF, questionId)
    const gameStatesRef = doc(GAMES_COLLECTION_REF, gameId, 'realtime', 'states')

    const [questionData, gameStatesData] = await Promise.all([
        getDocDataTransaction(transaction, questionRef),
        getDocDataTransaction(transaction, gameStatesRef)
    ])

    const { chooserOrder, chooserIdx } = gameStatesData
    const teamId = chooserOrder[chooserIdx]

    const playersCollectionRef = collection(GAMES_COLLECTION_REF, gameId, 'players')
    const choosersSnapshot = await getDocs(query(playersCollectionRef, where('teamId', '==', teamId)))

    const questionRealtimeRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId)

    if (idx === questionData.details.answerIdx) {
        // The selected proposal is the odd one one out
        const roundRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId)
        const roundData = await getDocDataTransaction(transaction, roundRef)
        const { mistakePenalty: points } = roundData
        await increaseRoundTeamScoreTransaction(transaction, gameId, roundId, questionId, teamId, points)

        for (const chooserDoc of choosersSnapshot.docs) {
            transaction.update(chooserDoc.ref, { status: 'wrong' })
        }
        // Move the "winner" to the head of the chooser list
        const newChooserOrder = moveToHead(teamId, chooserOrder)
        transaction.update(gameStatesRef, {
            chooserOrder: newChooserOrder
        })
        transaction.update(questionRealtimeRef, {
            winner: { playerId, teamId }
        })
        await addSoundEffectTransaction(transaction, gameId, 'hysterical5')
        await endQuestionTransaction(transaction, gameId, roundId, questionId)
    } else {
        // The select proposal is correct
        const questionRealtimeData = await getDocDataTransaction(transaction, questionRealtimeRef)
        const newNumClicked = questionRealtimeData.selectedItems.length + 1
        if (newNumClicked === questionData.details.items.length - 1) {
            // No one selected the odd one out
            await addSoundEffectTransaction(transaction, gameId, 'zelda_secret_door')
            await endQuestionTransaction(transaction, gameId, roundId, questionId)
        } else {
            // The selected proposal is not the last remaining one
            await switchNextChooserTransaction(transaction, gameId)
            await addSoundEffectTransaction(transaction, gameId, 'Bien')
            await updateTimerStateTransaction(transaction, gameId, 'reset')
        }
        for (const chooserDoc of choosersSnapshot.docs) {
            transaction.update(chooserDoc.ref, { status: 'idle' })
        }
    }
    transaction.update(questionRealtimeRef, {
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
    const questionRealtimeRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId)
    const questionRealtimeData = await getDocDataTransaction(transaction, questionRealtimeRef)

    const { selectedItems } = questionRealtimeData
    const selectedIdxsSet = new Set(selectedItems.map(item => item.idx));

    const remainingItems = [];
    for (let i = 0; i < OOO_ITEMS_LENGTH; i++) {
        if (!selectedIdxsSet.has(i)) {
            remainingItems.push(i);
        }
    }

    const randomIdx = remainingItems[Math.floor(Math.random() * remainingItems.length)];
    await selectProposalTransaction(transaction, gameId, roundId, questionId, 'system', randomIdx)
}

/* ==================================================================================================== */
export async function resetOddOneOutQuestion(gameId, roundId, questionId) {
    const batch = writeBatch(firestore)

    const gameStatesRef = doc(GAMES_COLLECTION_REF, gameId, 'realtime', 'states')
    batch.update(gameStatesRef, {
        chooserIdx: 0,
    })

    const questionRealtimeRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId)
    batch.update(questionRealtimeRef, {
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
    const gameStatesRef = doc(GAMES_COLLECTION_REF, gameId, 'realtime', 'states')
    transaction.update(gameStatesRef, {
        chooserIdx: 0,
    })

    const questionRealtimeRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId)
    transaction.update(questionRealtimeRef, {
        winner: null,
        selectedItems: [],
    })
}