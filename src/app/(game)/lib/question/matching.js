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

import { updateTimerStateTransaction } from '@/app/(game)/lib/timer';
import { switchNextChooserTransaction } from '@/app/(game)/lib/chooser'
import { addSoundEffectTransaction, addWrongAnswerSoundToQueueTransaction } from '@/app/(game)/lib/sounds';
import { getDocDataTransaction } from '@/app/(game)/lib/utils';
import { endQuestionTransaction } from '@/app/(game)/lib/question';
import { increaseRoundTeamScoreTransaction } from '@/app/(game)/lib/scores';

import { findMostFrequentValueAndIndices, generateMatch } from '@/lib/utils/question/matching';
import { sortScores } from '@/lib/utils/scores';
import { sortAscendingRoundScores } from '@/lib/utils/round';
import { getNextCyclicIndex, shuffle } from '@/lib/utils/arrays';


export async function submitMatch(gameId, roundId, questionId, userId, edges, match) {
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
    if ((!edges || edges.length === 0) && (!match || match.length === 0)) {
        throw new Error("No edges nor rows have been provided!");
    }

    try {
        await runTransaction(firestore, transaction =>
            submitMatchTransaction(transaction, gameId, roundId, questionId, userId, edges, match)
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
    edges = null,
    match = null
) => {
    const gameStatesRef = doc(GAMES_COLLECTION_REF, gameId, 'realtime', 'states')
    const gameStatesData = await getDocDataTransaction(transaction, gameStatesRef)
    const { chooserOrder, chooserIdx } = gameStatesData
    const teamId = chooserOrder[chooserIdx]

    const playersCollectionRef = collection(GAMES_COLLECTION_REF, gameId, 'players')
    const choosersSnapshot = await getDocs(query(playersCollectionRef, where('teamId', '==', teamId)))

    const correctMatchesRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId, 'realtime', 'correct')
    const roundScoresRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'realtime', 'scores')

    // edges is an array of numCols objects of the form {from: origRow0_col0, to: origRow1_col1}
    const rows = match || edges.flatMap((edge, idx) => {
        const fromNumericPart = parseInt(edge.from.match(/\d+/)[0]);
        const toNumericPart = parseInt(edge.to.match(/\d+/)[0]);
        return (idx === 0) ?
            [fromNumericPart, toNumericPart] :
            [toNumericPart]
    });

    const isCorrect = rows.every(row => row === rows[0])

    if (isCorrect) {
        // Case 1: The matching is correct
        const questionRef = doc(QUESTIONS_COLLECTION_REF, questionId)
        const [correctMatchesData, questionData] = await Promise.all([
            getDocDataTransaction(transaction, correctMatchesRef),
            getDocDataTransaction(transaction, questionRef),
        ])

        if (correctMatchesData.correctMatches.length === questionData.details.numRows - 1) {
            // Case 1.2: It is the last correct matching
            const roundScoresData = await getDocDataTransaction(transaction, roundScoresRef)
            const { scores: currentRoundScores } = roundScoresData

            await increaseRoundTeamScoreTransaction(transaction, gameId, roundId, questionId, teamId, 0)

            for (const chooserDoc of choosersSnapshot.docs) {
                transaction.update(chooserDoc.ref, { status: 'correct' })
            }

            transaction.update(correctMatchesRef, {
                correctMatches: arrayUnion({
                    matchIdx: rows[0],
                    userId,
                    teamId,
                    timestamp: Timestamp.now(),
                })
            })

            const sortedUniqueRoundScores = sortScores(currentRoundScores, sortAscendingRoundScores('matching'));
            const roundSortedTeams = sortedUniqueRoundScores.map(score => {
                const teamsWithThisScore = Object.keys(currentRoundScores).filter(tid => currentRoundScores[tid] === score);
                return { score, teams: teamsWithThisScore };
            });
            const newChooserOrder = roundSortedTeams.slice().reverse().flatMap(({ teams }) => shuffle(teams));
            transaction.update(gameStatesRef, {
                chooserOrder: newChooserOrder,
            })

            await addSoundEffectTransaction(transaction, gameId, 'zelda_secret_door')
            await endQuestionTransaction(transaction, gameId, roundId, questionId)
        } else {
            // Case 1.1: The matching is correct but not the last one
            await switchNextChooserTransaction(transaction, gameId)
            for (const chooserDoc of choosersSnapshot.docs) {
                transaction.update(chooserDoc.ref, { status: 'correct' })
            }
            await addSoundEffectTransaction(transaction, gameId, 'OUI')

            transaction.update(correctMatchesRef, {
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
        const roundRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId)
        const roundData = await getDocDataTransaction(transaction, roundRef)
        const { mistakePenalty: penalty } = roundData
        await increaseRoundTeamScoreTransaction(transaction, gameId, roundId, questionId, teamId, penalty)

        for (const chooserDoc of choosersSnapshot.docs) {
            transaction.update(chooserDoc.ref, { status: 'wrong' })
        }

        const newChooserIdx = getNextCyclicIndex(chooserIdx, chooserOrder.length)
        transaction.update(gameStatesRef, {
            chooserIdx: newChooserIdx
        })
        const newChooserTeamId = chooserOrder[newChooserIdx]
        const newChoosersSnapshot = await getDocs(query(playersCollectionRef, where('teamId', '==', newChooserTeamId)))
        for (const newChooserDoc of newChoosersSnapshot.docs) {
            transaction.update(newChooserDoc.ref, {
                status: 'focus'
            })
        }

        await addWrongAnswerSoundToQueueTransaction(transaction, gameId)

        const numCols = rows.length
        if (numCols > 2) {
            const [colIndices, rowIdx] = findMostFrequentValueAndIndices(rows)
            if (colIndices.length > 0 && rowIdx !== null) {
                const partiallyCorrectMatchesRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId, 'realtime', 'partially_correct')
                transaction.update(partiallyCorrectMatchesRef, {
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
        const incorrectMatchesRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId, 'realtime', 'incorrect')
        transaction.update(incorrectMatchesRef, {
            incorrectMatches: arrayUnion({
                match: rows,
                userId,
                teamId,
                timestamp: Timestamp.now(),
            }),
        })
    }
    // await updateTimerStateTransaction(transaction, gameId, 'reset')
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
    const questionRef = doc(QUESTIONS_COLLECTION_REF, questionId)
    const correctRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId, 'realtime', 'correct')
    const incorrectRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId, 'realtime', 'incorrect')

    const [questionData, correctData, incorrectData] = await Promise.all([
        getDocDataTransaction(transaction, questionRef),
        getDocDataTransaction(transaction, correctRef),
        getDocDataTransaction(transaction, incorrectRef),
    ])

    const { numCols, numRows } = questionData.details

    const correctMatchIndices = correctData.correctMatches.map(obj => obj.matchIdx)
    const incorrectMatches = incorrectData.incorrectMatches.map(obj => obj.match)
    const match = generateMatch(numRows, numCols, incorrectMatches, correctMatchIndices);

    await submitMatchTransaction(transaction, gameId, roundId, questionId, 'system', null, match)
}

/* ==================================================================================================== */
export async function resetMatchingQuestion(gameId, roundId, questionId) {
    const batch = writeBatch(firestore)

    const gameStatesRef = doc(GAMES_COLLECTION_REF, gameId, 'realtime', 'states')
    batch.update(gameStatesRef, {
        chooserIdx: 0,
    })

    const correctMatchesRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId, 'realtime', 'correct')
    batch.set(correctMatchesRef, {
        correctMatches: [],
    })

    const partiallyCorrectMatchesRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId, 'realtime', 'partially_correct')
    batch.set(partiallyCorrectMatchesRef, {
        partiallyCorrectMatches: [],
    })

    const incorrectMatchesRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId, 'realtime', 'incorrect')
    batch.set(incorrectMatchesRef, {
        incorrectMatches: [],
    })

    await batch.commit()
}

export const resetMatchingQuestionTransaction = async (transaction, gameId, roundId, questionId) => {
    const gameStatesRef = doc(GAMES_COLLECTION_REF, gameId, 'realtime', 'states')
    transaction.update(gameStatesRef, {
        chooserIdx: 0,
    })

    const correctMatchesRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId, 'realtime', 'correct')
    transaction.set(correctMatchesRef, {
        correctMatches: [],
    })

    const partiallyCorrectMatchesRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId, 'realtime', 'partially_correct')
    transaction.set(partiallyCorrectMatchesRef, {
        partiallyCorrectMatches: [],
    })

    const incorrectMatchesRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId, 'realtime', 'incorrect')
    transaction.set(incorrectMatchesRef, {
        incorrectMatches: [],
    })
}