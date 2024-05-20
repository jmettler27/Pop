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
    serverTimestamp,
    where,
    query,
    getDocs,
    increment
} from 'firebase/firestore'

import { switchNextChooserTransaction } from '@/app/(game)/lib/chooser'
import { addSoundToQueueTransaction, addWrongAnswerSoundToQueueTransaction } from '@/app/(game)/lib/sounds';

import { findMostFrequentValueAndIndices } from '@/lib/utils/question/matching';
import { getDocDataTransaction } from '@/app/(game)/lib/utils';
import { sortScores } from '@/lib/utils/scores';
import { sortAscendingRoundScores } from '@/lib/utils/question_types';
import { getNextCyclicIndex, shuffle } from '@/lib/utils/arrays';

import { endQuestionTransaction } from '@/app/(game)/lib/question';
import { updateTimerStateTransaction } from '../timer';

export async function submitMatch(gameId, roundId, questionId, userId, edges) {
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
        throw new Error("No user ID has been provided!");
    }
    if (!edges || edges.length === 0) {
        throw new Error("No edges have been provided!");
    }

    try {
        await runTransaction(firestore, transaction =>
            submitMatchTransaction(transaction, gameId, roundId, questionId, userId, edges)
        )
        console.log("Matching submission handled successfully.");
    } catch (error) {
        console.error("There was an error handling the matching submission:", error);
        throw error;
    }
}

const submitMatchTransaction = async (
    transaction,
    gameId,
    roundId,
    questionId,
    userId,
    edges
) => {
    const gameStatesRef = doc(GAMES_COLLECTION_REF, gameId, 'realtime', 'states')
    const gameStatesData = await getDocDataTransaction(transaction, gameStatesRef)
    const teamId = gameStatesData.chooserOrder[gameStatesData.chooserIdx]

    const playersCollectionRef = collection(GAMES_COLLECTION_REF, gameId, 'players')
    const q = query(playersCollectionRef, where('teamId', '==', teamId))
    const playersQuerySnapshot = await getDocs(q)

    const correctMatchesDocRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId, 'realtime', 'correct')
    const roundScoresRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'realtime', 'scores')

    // edges is an array of numCols objects of the form {from: origRow0_col0, to: origRow1_col1}
    const rows = edges.flatMap((edge, idx) => {
        const fromNumericPart = parseInt(edge.from.match(/\d+/)[0]);
        const toNumericPart = parseInt(edge.to.match(/\d+/)[0]);
        return (idx === 0) ?
            [fromNumericPart, toNumericPart] :
            [toNumericPart]
    });

    const isCorrect = rows.every(row => row === rows[0])

    if (isCorrect) {
        // Case 1: The matching is correct

        const questionDocRef = doc(QUESTIONS_COLLECTION_REF, questionId)
        const [correctMatchesData, questionData] = await Promise.all([
            getDocDataTransaction(transaction, correctMatchesDocRef),
            getDocDataTransaction(transaction, questionDocRef),
        ])

        if (correctMatchesData.correctMatches.length === questionData.details.numRows - 1) {
            // Case 1.2: It is the last correct matching

            const roundScoresData = await getDocDataTransaction(transaction, roundScoresRef)
            const { scores: currentRoundScores, scoresProgress: currentRoundProgress } = roundScoresData

            transaction.update(correctMatchesDocRef, {
                correctMatches: arrayUnion({
                    matchIdx: rows[0],
                    userId,
                    teamId,
                    timestamp: Timestamp.now(),
                })
            })

            const realtimeDocRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId)
            transaction.update(realtimeDocRef, {
                dateEnd: serverTimestamp(),
            })

            const newRoundProgress = {}
            const teamsQuerySnapshot = await getDocs(query(collection(GAMES_COLLECTION_REF, gameId, 'teams')))
            for (const teamDoc of teamsQuerySnapshot.docs) {
                newRoundProgress[teamDoc.id] = {
                    ...currentRoundProgress[teamDoc.id],
                    [questionId]: currentRoundScores[teamDoc.id]
                }
            }
            transaction.update(roundScoresRef, {
                scoresProgress: newRoundProgress
            })

            for (const playerDoc of playersQuerySnapshot.docs) {
                transaction.update(playerDoc.ref, { status: 'correct' })
            }

            await addSoundToQueueTransaction(transaction, gameId, 'Anime wow')

            // Sort the UNIQUE scores according to the notion of "winner first" 
            const sortedUniqueRoundScores = sortScores(currentRoundScores, sortAscendingRoundScores('matching'));
            const roundSortedTeams = sortedUniqueRoundScores.map(score => {
                const teamsWithThisScore = Object.keys(currentRoundScores).filter(teamId => currentRoundScores[teamId] === score);
                return { score, teams: teamsWithThisScore };
            });
            // updatedChooserOrder array is the flattened array of the teams in roundSortedTeams, in reverse order
            // slice() is used to create a copy of the roundSortedTeams array
            const updatedChooserOrder = roundSortedTeams.slice().reverse().flatMap(({ teams }) => shuffle(teams));
            transaction.update(gameStatesRef, {
                chooserOrder: updatedChooserOrder,
            })

            // End the question
            await endQuestionTransaction(transaction, gameId, roundId, questionId)

        } else {
            // Case 1.1: The matching is correct but not the last one
            await switchNextChooserTransaction(transaction, gameId)
            await addSoundToQueueTransaction(transaction, gameId, 'OUI')
            for (const playerDoc of playersQuerySnapshot.docs) {
                transaction.update(playerDoc.ref, { status: 'correct' })
            }

            transaction.update(correctMatchesDocRef, {
                correctMatches: arrayUnion({
                    matchIdx: rows[0],
                    userId,
                    teamId,
                    timestamp: Timestamp.now(),
                })
            })
        }
    } else {
        // Case 2: The matching is incorrect

        // let penalty = 0
        const roundRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId)
        const [roundData, roundScoresData] = await Promise.all([
            getDocDataTransaction(transaction, roundRef),
            getDocDataTransaction(transaction, roundScoresRef)
        ])

        const { mistakePenalty: penalty } = roundData
        const { scores: currentRoundScores, scoresProgress: currentRoundProgress } = roundScoresData
        const newRoundProgress = {}
        for (const tid of Object.keys(currentRoundScores)) {
            // Add an entry whose key is questionId and value is currentRoundScores[tid
            newRoundProgress[tid] = {
                ...currentRoundProgress[tid],
                [questionId]: currentRoundScores[tid] + (tid === teamId ? penalty : 0)
            }
        }

        await switchNextChooserTransaction(transaction, gameId)
        await addWrongAnswerSoundToQueueTransaction(transaction, gameId)
        for (const playerDoc of playersQuerySnapshot.docs) {
            transaction.update(playerDoc.ref, { status: 'wrong' })
        }

        transaction.update(roundScoresRef, {
            [`scores.${teamId}`]: increment(penalty),
            scoresProgress: newRoundProgress
        })

        const numCols = rows.length
        if (numCols > 2) {
            const [colIndices, rowIdx] = findMostFrequentValueAndIndices(rows)
            if (colIndices.length > 0 && rowIdx !== null) {
                const partiallyCorrectMatchesDocRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId, 'realtime', 'partially_correct')
                transaction.update(partiallyCorrectMatchesDocRef, {
                    partiallyCorrectMatches: arrayUnion({
                        colIndices,
                        matchIdx: rowIdx,
                        userId,
                        teamId,
                        timestamp: Timestamp.now(),
                    })
                })
            }
        }
        const incorrectMatchesDocRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId, 'realtime', 'incorrect')
        transaction.update(incorrectMatchesDocRef, {
            incorrectMatches: arrayUnion({
                match: rows,
                userId,
                teamId,
                timestamp: Timestamp.now(),
            }),
        })
    }

    await updateTimerStateTransaction(transaction, gameId, 'resetted')
}

/* ==================================================================================================== */
export async function handleMatchingCountdownEnd(gameId, roundId, questionId) {
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
            handleMatchingCountdownEndTransaction(transaction, gameId, roundId, questionId)
        )
        console.log("Matching countdown end handled successfully.");
    }
    catch (error) {
        console.error("There was an error handling the matching countdown end:", error);
        throw error;
    }
}

export const handleMatchingCountdownEndTransaction = async (transaction, gameId, roundId, questionId) => {
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

    const { mistakePenalty: penalty } = roundData
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

    transaction.update(gameStatesRef, {
        chooserIdx: newChooserIdx
    })

    await addWrongAnswerSoundToQueueTransaction(transaction, gameId)
    await updateTimerStateTransaction(transaction, gameId, 'resetted')
}

/* ==================================================================================================== */
export async function resetMatchingQuestion(gameId, roundId, questionId) {
    const batch = writeBatch(firestore)

    const statesDocRef = doc(GAMES_COLLECTION_REF, gameId, 'realtime', 'states')
    batch.update(statesDocRef, {
        chooserIdx: 0,
    })

    const correctMatchesDocRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId, 'realtime', 'correct')
    batch.set(correctMatchesDocRef, {
        correctMatches: [],
    })

    const partiallyCorrectMatchesDocRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId, 'realtime', 'partially_correct')
    batch.set(partiallyCorrectMatchesDocRef, {
        partiallyCorrectMatches: [],
    })

    const incorrectMatchesDocRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId, 'realtime', 'incorrect')
    batch.set(incorrectMatchesDocRef, {
        incorrectMatches: [],
    })

    await batch.commit()
}

export const resetMatchingQuestionTransaction = async (transaction, gameId, roundId, questionId) => {
    const statesDocRef = doc(GAMES_COLLECTION_REF, gameId, 'realtime', 'states')
    transaction.update(statesDocRef, {
        chooserIdx: 0,
    })

    const correctMatchesDocRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId, 'realtime', 'correct')
    transaction.set(correctMatchesDocRef, {
        correctMatches: [],
    })

    const partiallyCorrectMatchesDocRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId, 'realtime', 'partially_correct')
    transaction.set(partiallyCorrectMatchesDocRef, {
        partiallyCorrectMatches: [],
    })

    const incorrectMatchesDocRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId, 'realtime', 'incorrect')
    transaction.set(incorrectMatchesDocRef, {
        incorrectMatches: [],
    })
}