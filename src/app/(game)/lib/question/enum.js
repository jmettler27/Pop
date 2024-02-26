"use server";

import { GAMES_COLLECTION_REF } from '@/lib/firebase/firestore';
import { db } from '@/lib/firebase/firebase'
import {
    collection,
    query,
    where,
    getDocs,
    doc,
    setDoc,
    updateDoc,
    arrayUnion,
    increment,
    serverTimestamp,
    Timestamp,
    writeBatch,
    runTransaction
} from 'firebase/firestore'

import { addSoundToQueue, addSoundToQueueTransaction } from '@/app/(game)/lib/sounds';
import { getDocDataTransaction, updateGameStatusTransaction } from '@/app/(game)/lib/utils';
import { findHighestBidder } from '@/lib/utils/question/enum';

// WRITE
export async function updateEnumBets(gameId, roundId, questionId, fieldsToUpdate) {
    const playersDocRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId, 'realtime', 'players')
    const updateObject = { ...fieldsToUpdate }

    await updateDoc(playersDocRef, updateObject)
    console.log(`Game ${gameId}, Round ${roundId}, Question ${questionId} : Bet list updated`)
}

/* ============================================================================================================ */
// BATCHED WRITE
export async function addPlayerBet(gameId, roundId, questionId, playerId, teamId, bet) {
    const batch = writeBatch(db)

    const queueCollectionRef = collection(GAMES_COLLECTION_REF, gameId, 'realtime', 'sounds', 'queue')
    const newSoundDocument = doc(queueCollectionRef);
    batch.set(newSoundDocument, {
        timestamp: serverTimestamp(),
        filename: 'pop',
        uid: playerId
    })

    const playersDocRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId, 'realtime', 'players')
    batch.update(playersDocRef, {
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
// WRITE
async function updateEnumRealtime(gameId, roundId, questionId, fieldsToUpdate) {
    const realtimeDocRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId)
    const updateObject = { ...fieldsToUpdate }

    await updateDoc(realtimeDocRef, updateObject)
    console.log(`Game ${gameId}, Round ${roundId}, Question ${questionId} : States updated`)
}

// WRITE
export async function updateEnumQuestionState(gameId, roundId, questionId, newStatus) {
    await updateEnumRealtime(gameId, roundId, questionId, {
        status: newStatus
    })
}

/* ============================================================================================================ */
/**
 * reflection_active -> challenge_active
 */
// TRANSACTION
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
        await runTransaction(db, transaction =>
            endEnumReflectionTransaction(transaction, gameId, roundId, questionId)
        );
        console.log(`Question ${questionId} ended successfully.`)
    }
    catch (error) {
        console.error("There was an error ending the enum reflection:", error);
        throw error;
    }
}

const endEnumReflectionTransaction = async (
    transaction,
    gameId,
    roundId,
    questionId
) => {
    const playersDocRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId, 'realtime', 'players')
    const playersData = await getDocDataTransaction(transaction, playersDocRef)

    const realtimeDocRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId)

    /* No player made a bet */
    if (playersData.bets.length === 0) {
        transaction.update(realtimeDocRef, {
            dateEnd: serverTimestamp()
        })

        const gameDocRef = doc(GAMES_COLLECTION_REF, gameId)
        transaction.update(gameDocRef, {
            status: 'question_end'
        })
    } else {
        // Calculate the 'challenger' of this question (the best player)
        const [playerId, teamId, bet] = findHighestBidder(playersData.bets)
        transaction.update(playersDocRef, {
            challenger: {
                playerId,
                teamId,
                bet,
                numCorrect: 0,
                cited: {}
            }
        })

        const challengerDocRef = doc(GAMES_COLLECTION_REF, gameId, 'players', playerId)
        transaction.update(challengerDocRef, {
            status: 'focus'
        })

        transaction.update(realtimeDocRef, {
            status: 'challenge_active'
        })
    }
}

/* ============================================================================================================ */
// BATCHED WRITE
export async function handleEnumAnswerItemClick(gameId, roundId, questionId, organizerId, itemIdx) {
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
    if (itemIdx === undefined) {
        throw new Error("No item index has been provided!");
    }

    try {
        await runTransaction(db, transaction =>
            handleEnumAnswerItemClickTransaction(transaction, gameId, roundId, questionId, organizerId, itemIdx)
        );
        console.log(`Enum question ${questionId}: Item ${itemIdx} click successfully handled.`)
    }
    catch (error) {
        console.error("There was an error handling the enum question item click:", error);
        throw error;
    }
}

const handleEnumAnswerItemClickTransaction = async (
    transaction,
    gameId,
    roundId,
    questionId,
    organizerId,
    itemIdx
) => {
    const playersDocRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId, 'realtime', 'players')
    transaction.update(playersDocRef, {
        ['challenger.numCorrect']: increment(1),
        [`challenger.cited.${itemIdx}`]: serverTimestamp()

    })

    await addSoundToQueueTransaction(transaction, gameId, organizerId, 'super_mario_world_coin')
}

// BATCHED WRITE
export async function incrementChallengerNumCorrect(gameId, roundId, questionId, organizerId) {
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
    const batch = writeBatch(db)

    const queueCollectionRef = collection(GAMES_COLLECTION_REF, gameId, 'realtime', 'sounds', 'queue')
    const newSoundDocument = doc(queueCollectionRef);
    batch.set(newSoundDocument, {
        timestamp: serverTimestamp(),
        filename: 'super_mario_world_coin',
        uid: organizerId
    })

    const playersDocRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId, 'realtime', 'players')
    batch.update(playersDocRef, {
        ['challenger.numCorrect']: increment(1)
    })

    await batch.commit()
}


/* ============================================================================================================ */
/**
 * question_active -> question_end
 */
// TRANSACTION
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
        await runTransaction(db, transaction =>
            endEnumQuestionTransaction(transaction, gameId, roundId, questionId)
        );
        console.log(`Question ${questionId} ended successfully.`)
    }
    catch (error) {
        console.error("There was an error ending the enum question:", error);
        throw error;
    }
}

const endEnumQuestionTransaction = async (
    transaction,
    gameId,
    roundId,
    questionId
) => {
    const roundDocRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId)
    const roundScoresRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'realtime', 'scores')
    const playersDocRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId, 'realtime', 'players')

    const [roundData, roundScoresData, playersData] = await Promise.all([
        getDocDataTransaction(transaction, roundDocRef),
        getDocDataTransaction(transaction, roundScoresRef),
        getDocDataTransaction(transaction, playersDocRef),
    ])

    const { challenger } = playersData
    const { teamId, playerId, numCorrect, bet } = challenger

    const { scores: currentRoundScores, scoresProgress: currentRoundProgress } = roundScoresData

    const playersCollectionRef = collection(GAMES_COLLECTION_REF, gameId, 'players')
    const challengerTeamPlayersQuery = query(playersCollectionRef, where('teamId', '==', teamId))
    const challengerTeamPlayersQuerySnapshot = await getDocs(challengerTeamPlayersQuery)

    const realtimeDocRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId)

    if (numCorrect < bet) {
        // The challenger did not succeed in its challenge
        const reward = roundData.rewardsPerQuestion

        for (const playerDoc of challengerTeamPlayersQuerySnapshot.docs) {
            transaction.update(playerDoc.ref, {
                status: 'wrong'
            })
        }

        const newRoundScores = {}
        const newRoundProgress = {}
        newRoundScores[teamId] = currentRoundScores[teamId]
        newRoundProgress[teamId] = {
            ...currentRoundProgress[teamId],
            [questionId]: currentRoundScores[teamId]
        }

        const teamsCollectionRef = collection(GAMES_COLLECTION_REF, gameId, 'teams')
        const otherTeamsQuerySnapshot = await getDocs(query(teamsCollectionRef, where('id', '!=', teamId)))
        for (const otherTeamDoc of otherTeamsQuerySnapshot.docs) {
            newRoundProgress[otherTeamDoc.id] = {
                ...currentRoundProgress[otherTeamDoc.id],
                [questionId]: currentRoundScores[otherTeamDoc.id] + reward
            }
            newRoundScores[otherTeamDoc.id] = currentRoundScores[otherTeamDoc.id] + reward

            const otherTeamPlayersQuery = query(playersCollectionRef, where('teamId', '==', otherTeamDoc.id))
            const otherTeamPlayersQuerySnapshot = await getDocs(otherTeamPlayersQuery)
            for (const playerDoc of otherTeamPlayersQuerySnapshot.docs) {
                transaction.update(playerDoc.ref, {
                    status: 'correct'
                })
            }
        }
        transaction.update(roundScoresRef, {
            scores: newRoundScores,
            scoresProgress: newRoundProgress
        })
    } else {
        // The challenger succeeded in its challenge
        const reward = roundData.rewardsPerQuestion + (numCorrect > bet) * roundData.rewardsForBonus

        const newRoundProgress = {}
        for (const tid of Object.keys(currentRoundScores)) {
            newRoundProgress[tid] = {
                ...currentRoundProgress[tid],
                [questionId]: currentRoundScores[tid] + (tid === teamId) * reward
            }
        }
        transaction.update(roundScoresRef, {
            [`scores.${teamId}`]: increment(reward),
            scoresProgress: newRoundProgress
        })

        for (const playerDoc of challengerTeamPlayersQuerySnapshot.docs) {
            transaction.update(playerDoc.ref, {
                status: 'correct'
            })
        }
        transaction.update(realtimeDocRef, {
            winner: {
                playerId,
                teamId
            }
        })
    }

    transaction.update(realtimeDocRef, {
        dateEnd: serverTimestamp()
    })

    await updateGameStatusTransaction(transaction, gameId, 'question_end')
}

/* ============================================================================================================ */
// BATCHED WRITE
export async function resetEnumQuestion(gameId, roundId, questionId) {
    const batch = writeBatch(db)

    const playersDocRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId, 'realtime', 'players')
    batch.set(playersDocRef, {
        bets: [],
    })

    const realtimeDocRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId)
    batch.set(realtimeDocRef, {
        status: 'reflection_active',
        winner: null,
        managedBy: 'YhDISaNL0SaJg2Haa765'
    })

    const timerDocRef = doc(GAMES_COLLECTION_REF, gameId, 'realtime', 'timer')
    batch.update(timerDocRef, {
        status: 'resetted'
    })

    await batch.commit()
}


// WRITE
async function resetEnumBets(gameId, roundId, questionId) {
    await initEnumBets(gameId, roundId, questionId, {
        bets: [],
    })
}

// WRITE
async function initEnumBets(gameId, roundId, questionId, fieldsToUpdate) {
    const playersDocRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId, 'realtime', 'players')
    const updateObject = { ...fieldsToUpdate }

    await setDoc(playersDocRef, updateObject)
    console.log(`Game ${gameId}, Round ${roundId}, Question ${questionId} : Bets initialized`)
}

// WRITE
async function resetEnumRealtime(gameId, roundId, questionId) {
    await initEnumRealtime(gameId, roundId, questionId, {
        status: 'reflection_active',
    })
}

// WRITE
async function initEnumRealtime(gameId, roundId, questionId, fieldsToUpdate) {
    const realtimeDocRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId)
    const updateObject = { ...fieldsToUpdate }

    await setDoc(realtimeDocRef, updateObject)
    console.log(`Game ${gameId}, Round ${roundId}, Question ${questionId} : States initialized`)
}
