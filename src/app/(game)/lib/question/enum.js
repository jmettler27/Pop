"use server";

import { GAMES_COLLECTION_REF, QUESTIONS_COLLECTION_REF } from '@/lib/firebase/firestore';
import { firestore } from '@/lib/firebase/firebase'
import {
    collection,
    query,
    where,
    getDocs,
    doc,
    updateDoc,
    arrayUnion,
    increment,
    serverTimestamp,
    Timestamp,
    writeBatch,
    runTransaction,
    documentId
} from 'firebase/firestore'

import { addSoundEffectTransaction } from '@/app/(game)/lib/sounds';
import { getDocDataTransaction } from '@/app/(game)/lib/utils';
import { updateTimerTransaction } from '@/app/(game)/lib/timer';
import { endQuestionTransaction } from '@/app/(game)/lib/question';
import { updatePlayerStatusTransaction } from '@/app/(game)/lib/players';
import { increaseRoundTeamScoreTransaction } from '@/app/(game)/lib/scores';

import { findHighestBidder } from '@/lib/utils/question/enum';

export async function updateEnumBets(gameId, roundId, questionId, fieldsToUpdate) {
    const questionPlayersRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId, 'realtime', 'players')
    const updateObject = { ...fieldsToUpdate }

    await updateDoc(questionPlayersRef, updateObject)
    console.log(`Game ${gameId}, Round ${roundId}, Question ${questionId} : Bet list updated`)
}

/* ============================================================================================================ */
export async function addPlayerBet(gameId, roundId, questionId, playerId, teamId, bet) {
    const batch = writeBatch(firestore)

    const queueCollectionRef = collection(GAMES_COLLECTION_REF, gameId, 'realtime', 'sounds', 'queue')
    const newSoundDocument = doc(queueCollectionRef);
    batch.set(newSoundDocument, {
        timestamp: serverTimestamp(),
        filename: 'pop',
    })

    const questionPlayersRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId, 'realtime', 'players')
    batch.update(questionPlayersRef, {
        bets: arrayUnion({
            playerId,
            teamId,
            bet,
            timestamp: Timestamp.now()
        })
    })

    await batch.commit()
}

/* ============================================================================================================ */
async function updateEnumRealtime(gameId, roundId, questionId, fieldsToUpdate) {
    const questionRealtimeRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId)
    const updateObject = { ...fieldsToUpdate }

    await updateDoc(questionRealtimeRef, updateObject)
    console.log(`Game ${gameId}, Round ${roundId}, Question ${questionId} : States updated`)
}

export async function updateEnumQuestionState(gameId, roundId, questionId, newStatus) {
    await updateEnumRealtime(gameId, roundId, questionId, {
        status: newStatus
    })
}

/* ============================================================================================================ */
/**
 * reflection_active -> challenge_active
 */
export async function endEnumReflection(gameId, roundId, questionId) {
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
            endEnumReflectionTransaction(transaction, gameId, roundId, questionId)
        );
        console.log(`Question ${questionId} ended successfully.`)
    }
    catch (error) {
        console.error("There was an error ending the enum reflection:", error);
        throw error;
    }
}

export const endEnumReflectionTransaction = async (
    transaction,
    gameId,
    roundId,
    questionId
) => {
    const questionPlayersRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId, 'realtime', 'players')
    const questionPlayersData = await getDocDataTransaction(transaction, questionPlayersRef)

    const questionRealtimeRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId)

    /* No player made a bet */
    if (questionPlayersData.bets.length === 0) {
        await endQuestionTransaction(transaction, gameId, roundId, questionId)
    } else {
        const questionRef = doc(QUESTIONS_COLLECTION_REF, questionId)
        const questionData = await getDocDataTransaction(transaction, questionRef)

        // Calculate the 'challenger' of this question (the best player)
        const [playerId, teamId, bet] = findHighestBidder(questionPlayersData.bets)
        transaction.update(questionPlayersRef, {
            challenger: {
                playerId,
                teamId,
                bet,
                numCorrect: 0,
                cited: {}
            }
        })

        await updatePlayerStatusTransaction(transaction, gameId, playerId, 'focus')

        transaction.update(questionRealtimeRef, {
            status: 'challenge_active'
        })

        await updateTimerTransaction(transaction, gameId, {
            duration: questionData.details.challengeTime,
            status: 'reset',
        })
    }
}

/* ============================================================================================================ */
export async function validateEnumItem(gameId, roundId, questionId, itemIdx) {
    if (!gameId) {
        throw new Error("No game ID has been provided!");
    }
    if (!roundId) {
        throw new Error("No round ID has been provided!");
    }
    if (!questionId) {
        throw new Error("No question ID has been provided!");
    }
    if (itemIdx === undefined) {
        throw new Error("No item index has been provided!");
    }

    try {
        await runTransaction(firestore, transaction =>
            validateEnumItemTransaction(transaction, gameId, roundId, questionId, itemIdx)
        );
        console.log(`Enum question ${questionId}: Item ${itemIdx} click successfully handled.`)
    }
    catch (error) {
        console.error("There was an error handling the enum question item click:", error);
        throw error;
    }
}

const validateEnumItemTransaction = async (
    transaction,
    gameId,
    roundId,
    questionId,
    itemIdx
) => {
    const questionPlayersRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId, 'realtime', 'players')
    transaction.update(questionPlayersRef, {
        ['challenger.numCorrect']: increment(1),
        [`challenger.cited.${itemIdx}`]: serverTimestamp()

    })
    await addSoundEffectTransaction(transaction, gameId, 'super_mario_world_coin')
}

export async function incrementCorrectAnswersCount(gameId, roundId, questionId, organizerId) {
    if (!gameId) {
        throw new Error("No game ID has been provided!");
    }
    if (!roundId) {
        throw new Error("No round ID has been provided!");
    }
    if (!questionId) {
        throw new Error("No question ID has been provided!");
    }
    if (!organizerId) {
        throw new Error("No organizer ID has been provided!");
    }
    const batch = writeBatch(firestore)

    const queueCollectionRef = collection(GAMES_COLLECTION_REF, gameId, 'realtime', 'sounds', 'queue')
    const newSoundDocument = doc(queueCollectionRef);
    batch.set(newSoundDocument, {
        timestamp: serverTimestamp(),
        filename: 'super_mario_world_coin',
    })

    const questionPlayersRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId, 'realtime', 'players')
    batch.update(questionPlayersRef, {
        ['challenger.numCorrect']: increment(1)
    })

    await batch.commit()
}


/* ============================================================================================================ */
/**
 * question_active -> question_end
 */
export async function endEnumQuestion(gameId, roundId, questionId) {
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
            endEnumQuestionTransaction(transaction, gameId, roundId, questionId)
        );
        console.log(`Question ${questionId} ended successfully.`)
    }
    catch (error) {
        console.error("There was an error ending the enum question:", error);
        throw error;
    }
}

export const endEnumQuestionTransaction = async (
    transaction,
    gameId,
    roundId,
    questionId
) => {
    const roundRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId)
    const roundScoresRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'realtime', 'scores')
    const questionPlayersRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId, 'realtime', 'players')

    const [roundData, roundScoresData, questionPlayersData] = await Promise.all([
        getDocDataTransaction(transaction, roundRef),
        getDocDataTransaction(transaction, roundScoresRef),
        getDocDataTransaction(transaction, questionPlayersRef),
    ])

    const { challenger } = questionPlayersData
    const { teamId, playerId, numCorrect, bet } = challenger

    const { scores: currentRoundScores, scoresProgress: currentRoundProgress } = roundScoresData

    const playersCollectionRef = collection(GAMES_COLLECTION_REF, gameId, 'players')
    const challengersSnapshot = await getDocs(query(playersCollectionRef, where('teamId', '==', teamId)))

    const questionRealtimeRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId)

    if (numCorrect < bet) {
        // The challenger did not succeed in its challenge
        const { rewardsPerQuestion: reward } = roundData

        for (const challengerDoc of challengersSnapshot.docs) {
            transaction.update(challengerDoc.ref, {
                status: 'wrong'
            })
        }
        const newRoundScores = {}
        const newRoundProgress = {}
        newRoundScores[teamId] = currentRoundScores[teamId] || 0
        newRoundProgress[teamId] = {
            ...currentRoundProgress[teamId],
            [questionId]: currentRoundScores[teamId] || 0
        }

        const spectatorsSnapshot = await getDocs(query(playersCollectionRef, where('teamId', '!=', teamId)))
        for (const spectatorDoc of spectatorsSnapshot.docs) {
            transaction.update(spectatorDoc.ref, {
                status: 'correct'
            })
        }
        const teamsCollectionRef = collection(GAMES_COLLECTION_REF, gameId, 'teams')
        const spectatorTeamsSnapshot = await getDocs(query(teamsCollectionRef, where(documentId(), '!=', teamId)))
        for (const spectatorTeamDoc of spectatorTeamsSnapshot.docs) {
            const stid = spectatorTeamDoc.id
            newRoundProgress[stid] = {
                ...currentRoundProgress[stid],
                [questionId]: currentRoundScores[stid] + reward
            }
            newRoundScores[stid] = currentRoundScores[stid] + reward
        }

        transaction.update(roundScoresRef, {
            scores: newRoundScores,
            scoresProgress: newRoundProgress
        })
    } else {
        // The challenger succeeded in its challenge
        const reward = roundData.rewardsPerQuestion + (numCorrect > bet) * roundData.rewardsForBonus
        await increaseRoundTeamScoreTransaction(transaction, gameId, roundId, questionId, teamId, reward)

        for (const challengerDoc of challengersSnapshot.docs) {
            transaction.update(challengerDoc.ref, {
                status: 'correct'
            })
        }
        transaction.update(questionRealtimeRef, {
            winner: { playerId, teamId }
        })
    }
    await endQuestionTransaction(transaction, gameId, roundId, questionId)
}

/* ============================================================================================================ */
export async function resetEnumQuestion(gameId, roundId, questionId) {
    const batch = writeBatch(firestore)

    const questionPlayersRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId, 'realtime', 'players')
    batch.set(questionPlayersRef, {
        bets: [],
    })

    const questionRealtimeRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId)
    batch.set(questionRealtimeRef, {
        status: 'reflection_active',
        winner: null,
    })

    const timerRef = doc(GAMES_COLLECTION_REF, gameId, 'realtime', 'timer')
    batch.update(timerRef, {
        status: 'reset',
        timestamp: serverTimestamp()
    })

    await batch.commit()
}

export const resetEnumQuestionTransaction = async (
    transaction,
    gameId,
    roundId,
    questionId
) => {
    const questionPlayersRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId, 'realtime', 'players')
    transaction.set(questionPlayersRef, {
        bets: [],
    })
    const questionRealtimeRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId)
    transaction.set(questionRealtimeRef, {
        status: 'reflection_active',
        winner: null,
    })

}
