"use server";

import { GAMES_COLLECTION_REF, QUESTIONS_COLLECTION_REF } from '@/backend/firebase/firestore';
import { firestore } from '@/backend/firebase/firebase'
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

import { addSoundTransaction } from '@/backend/services/sound/sounds';
import { getDocDataTransaction } from '@/backend/services/utils';
import { updateTimerTransaction } from '@/backend/services/timer/timer';
import { endQuestionTransaction } from '@/backend/services/question/actions';
import { updatePlayerStatusTransaction } from '@/backend/services/game/player/players';
import { increaseRoundTeamScoreTransaction } from '@/backend/services/scoring/scores';

import { TimerStatus } from '@/backend/models/Timer';
import { PlayerStatus } from '@/backend/models/users/Player';
import { EnumerationQuestionStatus } from '@/backend/models/questions/Enumeration';
import { isArray } from '@/backend/utils/arrays';


export async function resetEnumQuestion(gameId, roundId, questionId) {
    const batch = writeBatch(firestore)

    const questionPlayersRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId, 'realtime', 'players')
    batch.set(questionPlayersRef, {
        bets: [],
    })

    const gameQuestionRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId)
    batch.set(gameQuestionRef, {
        status: EnumerationQuestionStatus.REFLECTION,
        winner: null,
    })

    const timerRef = doc(GAMES_COLLECTION_REF, gameId, 'realtime', 'timer')
    batch.update(timerRef, {
        status: TimerStatus.RESET,
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
    const gameQuestionRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId)
    transaction.update(gameQuestionRef, {
        status: EnumerationQuestionStatus.REFLECTION,
        winner: null,
    })

}


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
        console.log(`Question ${questionId} successfully ended.`)
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

    const gameQuestionRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId)

    if (numCorrect < bet) {
        // The challenger did not succeed in its challenge
        const { rewardsPerQuestion: reward } = roundData

        for (const challengerDoc of challengersSnapshot.docs) {
            transaction.update(challengerDoc.ref, {
                status: PlayerStatus.WRONG
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
                status: PlayerStatus.CORRECT
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
                status: PlayerStatus.CORRECT
            })
        }
        transaction.update(gameQuestionRef, {
            winner: { playerId, teamId }
        })
    }
    await endQuestionTransaction(transaction, gameId, roundId, questionId)
}

/* ============================================================================================================ */

export async function updateEnumBets(gameId, roundId, questionId, fieldsToUpdate) {
    const questionPlayersRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId, 'realtime', 'players')
    const updateObject = { ...fieldsToUpdate }

    await updateDoc(questionPlayersRef, updateObject)
    console.log(`Game ${gameId}, Round ${roundId}, Question ${questionId} : Bet list updated`)
}

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

async function updateGameEnumerationQuestion(gameId, roundId, questionId, fieldsToUpdate) {
    const gameQuestionRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId)
    const updateObject = { ...fieldsToUpdate }

    await updateDoc(gameQuestionRef, updateObject)
    console.log(`Game ${gameId}, Round ${roundId}, Question ${questionId} : States updated`)
}
export async function updateEnumQuestionState(gameId, roundId, questionId, newStatus) {
    await updateGameEnumerationQuestion(gameId, roundId, questionId, {
        status: newStatus
    })
}

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
        console.log(`Question ${questionId} successfully ended.`)
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

    const gameQuestionRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId)

    /* No player made a bet */
    if (questionPlayersData.bets.length === 0) {
        await endQuestionTransaction(transaction, gameId, roundId, questionId)
    } else {
        const baseQuestionRef = doc(QUESTIONS_COLLECTION_REF, questionId)
        const baseQuestion = await getDocDataTransaction(transaction, baseQuestionRef)

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

        await updatePlayerStatusTransaction(transaction, gameId, playerId, PlayerStatus.FOCUS)

        transaction.update(gameQuestionRef, {
            status: EnumerationQuestionStatus.CHALLENGE
        })

        await updateTimerTransaction(transaction, gameId, {
            duration: baseQuestion.details.challengeTime,
            status: TimerStatus.RESET,
        })
    }
}

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
    await addSoundTransaction(transaction, gameId, 'super_mario_world_coin')
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

