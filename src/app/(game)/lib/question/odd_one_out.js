"use server";

import { GAMES_COLLECTION_REF, QUESTIONS_COLLECTION_REF } from '@/lib/firebase/firestore';
import { db } from '@/lib/firebase/firebase'
import {
    doc,
    arrayUnion,
    Timestamp,
    writeBatch,
    runTransaction,
    collection,
    serverTimestamp,
    where,
    query,
    getDocs,
    increment
} from 'firebase/firestore'

import { switchNextChooserTransaction } from '@/app/(game)/lib/chooser'
import { addSoundToQueueTransaction } from '@/app/(game)/lib/sounds';
import { getDocDataTransaction } from '@/app/(game)/lib/utils';

import { getNextCyclicIndex, moveToHead } from '@/lib/utils/arrays';
import { endQuestionTransaction } from '@/app/(game)/lib/question';

export async function handleProposalClick(gameId, roundId, questionId, userId, idx) {
    if (!gameId) {
        throw new Error("No game ID has been provided!");
    }
    if (!roundId) {
        throw new Error("No round ID has been provided!");
    }
    if (!questionId) {
        throw new Error("No question ID has been provided!");
    }
    if (!userId) {
        throw new Error("No player ID has been provided!");
    }

    try {
        await runTransaction(db, transaction =>
            handleProposalClickTransaction(transaction, gameId, roundId, questionId, userId, idx)
        )
        console.log("Proposal click handled successfully.");
    } catch (error) {
        console.error("There was an error handling the proposal click:", error);
        throw error;
    }
}
const handleProposalClickTransaction = async (
    transaction,
    gameId,
    roundId,
    questionId,
    userId,
    idx
) => {
    const questionDocRef = doc(QUESTIONS_COLLECTION_REF, questionId)
    const statesDocRef = doc(GAMES_COLLECTION_REF, gameId, 'realtime', 'states')

    const [questionData, statesData] = await Promise.all([
        getDocDataTransaction(transaction, questionDocRef),
        getDocDataTransaction(transaction, statesDocRef)
    ])

    const teamId = statesData.chooserOrder[statesData.chooserIdx]

    const playersCollectionRef = collection(GAMES_COLLECTION_REF, gameId, 'players')
    const q = query(playersCollectionRef, where('teamId', '==', teamId))
    const querySnapshot = await getDocs(q)

    const realtimeDocRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId)

    // Case 1: Is the odd proposal => The first player to find the odd 'wins'
    if (idx === questionData.details.answerIdx) {
        const roundRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId)
        const roundScoresRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'realtime', 'scores')

        const [roundData, roundScoresData] = await Promise.all([
            getDocDataTransaction(transaction, roundRef),
            getDocDataTransaction(transaction, roundScoresRef)
        ])

        const { mistakePenalty: penalty } = roundData
        const { scores: currentScores, scoresProgress: currentProgress } = roundScoresData
        const newProgress = {}
        for (const tid of Object.keys(currentScores)) {
            newProgress[tid] = {
                ...currentProgress[tid],
                [questionId]: currentScores[tid] + (tid === teamId) * penalty
            }
        }
        transaction.update(roundScoresRef, {
            [`scores.${teamId}`]: increment(penalty),
            scoresProgress: newProgress
        })

        for (const playerDoc of querySnapshot.docs) {
            transaction.update(playerDoc.ref, { status: 'wrong' })
        }
        await addSoundToQueueTransaction(transaction, gameId, 'hysterical5')

        // Move the "winner" to the head of the chooser list
        const newChooserOrder = moveToHead(teamId, statesData.chooserOrder)
        transaction.update(statesDocRef, {
            chooserOrder: newChooserOrder
        })

        transaction.update(realtimeDocRef, {
            winner: {
                playerId: userId,
                teamId
            },
            dateEnd: serverTimestamp()
        })

        await endQuestionTransaction(transaction, gameId, roundId, questionId)
    } else {
        const realtimeData = await getDocDataTransaction(transaction, realtimeDocRef)

        // Case 2: Was the last good proposal => No one found the odd
        const newNumClicked = realtimeData.selectedItems.length + 1
        if (newNumClicked === questionData.details.items.length - 1) {
            for (const playerDoc of querySnapshot.docs) {
                transaction.update(playerDoc.ref, { status: 'idle' })
            }
            await addSoundToQueueTransaction(transaction, gameId, 'Akeryo_en_susu')

            transaction.update(realtimeDocRef, {
                dateEnd: serverTimestamp()
            })
            await endQuestionTransaction(transaction, gameId, roundId, questionId)
        } else {
            // Case 3: Was a good proposal but not the last one
            await switchNextChooserTransaction(transaction, gameId)
            for (const playerDoc of querySnapshot.docs) {
                transaction.update(playerDoc.ref, { status: 'idle' })
            }
            await addSoundToQueueTransaction(transaction, gameId, 'Bien')
        }
    }
    transaction.update(realtimeDocRef, {
        selectedItems: arrayUnion({
            idx,
            playerId: userId,
            timestamp: Timestamp.now()
        })
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
        await runTransaction(db, transaction =>
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
    const gameStatesRef = doc(GAMES_COLLECTION_REF, gameId, 'realtime', 'states')
    const roundRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId)
    const roundScoresRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'realtime', 'scores')

    const [gameStatesData, roundData, roundScoresData] = await Promise.all([
        getDocDataTransaction(transaction, gameStatesRef),
        getDocDataTransaction(transaction, roundRef),
        getDocDataTransaction(transaction, roundScoresRef)
    ])

    const { chooserOrder, chooserIdx } = gameStatesData
    const teamId = chooserOrder[chooserIdx]
    const newChooserIdx = getNextCyclicIndex(chooserIdx, chooserOrder.length)

    const playersCollectionRef = collection(GAMES_COLLECTION_REF, gameId, 'players')
    const q = query(playersCollectionRef, where('teamId', '==', teamId))
    const playersQuerySnapshot = await getDocs(q)

    const { rewardsPerQuestion: penalty } = roundData
    const { scores: currentRoundScores, scoresProgress: currentRoundProgress } = roundScoresData
    const newRoundProgress = {}
    for (const tid of Object.keys(currentRoundScores)) {
        newRoundProgress[tid] = {
            ...currentRoundProgress[tid],
            [questionId]: currentRoundScores[tid] + (tid === teamId) * penalty
        }
    }

    transaction.update(roundScoresRef, {
        [`scores.${teamId}`]: increment(penalty),
        scoresProgress: newRoundProgress
    })

    for (const playerDoc of playersQuerySnapshot.docs) {
        transaction.update(playerDoc.ref, { status: 'wrong' })
    }

    await addSoundToQueueTransaction(transaction, gameId, 'roblox_oof')

    transaction.update(gameStatesRef, {
        chooserIdx: newChooserIdx
    })

}

/* ==================================================================================================== */
// BATCHED WRITE
export async function resetOddOneOutQuestion(gameId, roundId, questionId) {
    const batch = writeBatch(db)

    // updateGameStates(gameId, {
    //     chooserIdx: 0,
    // })
    const statesDocRef = doc(GAMES_COLLECTION_REF, gameId, 'realtime', 'states')
    batch.update(statesDocRef, {
        chooserIdx: 0,
    })

    // updateQuestionWinner(gameId, roundId, questionId, null)
    const realtimeDocRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId)
    batch.update(realtimeDocRef, {
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
    const statesDocRef = doc(GAMES_COLLECTION_REF, gameId, 'realtime', 'states')
    transaction.update(statesDocRef, {
        chooserIdx: 0,
    })

    const realtimeDocRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId)
    transaction.update(realtimeDocRef, {
        winner: null,
        selectedItems: [],
    })
}