"use server";

import { GAMES_COLLECTION_REF, QUESTIONS_COLLECTION_REF } from '@/lib/firebase/firestore';
import { db } from '@/lib/firebase/firebase'
import {
    collection,
    query,
    where,
    getDocs,
    doc,
    serverTimestamp,
    runTransaction,
    limit,
    writeBatch,
} from 'firebase/firestore'

import { getNextCyclicIndex, shuffle } from '@/lib/utils/arrays';
import { isRiddle, sortAscendingRoundScores } from '@/lib/utils/question_types';

import { addSoundToQueueTransaction } from '@/app/(game)/lib/sounds';
import { getDocDataTransaction, updateGameStatusTransaction } from '@/app/(game)/lib/utils';
import { sortScores } from '@/lib/utils/scores';
import { updateTimerTransaction } from '../timer';

/* ==================================================================================================== */
/**
 * game_home -> round_start
 * Switch to the round that has been selected by the chooser
 * 
 */
// TRANSACTION
/**
 */
export async function handleSelectRound(gameId, roundId, userId) {
    if (!gameId) {
        throw new Error("No game ID has been provided!");
    }
    if (!roundId) {
        throw new Error("No round ID has been provided!");
    }
    if (!userId) {
        throw new Error("No user ID has been provided!")
    }
    try {
        await runTransaction(db, transaction =>
            selectRoundTransaction(transaction, gameId, roundId, userId)
        );
        console.log("Round successfully started.");

    } catch (error) {
        console.error("There was an error starting the round:", error);
        throw error;
    }
}
const selectRoundTransaction = async (
    transaction,
    gameId,
    roundId,
    userId
) => {
    const roundRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId)
    const statesRef = doc(GAMES_COLLECTION_REF, gameId, 'realtime', 'states')
    const gameRef = doc(GAMES_COLLECTION_REF, gameId)

    const [roundData, statesData, gameData] = await Promise.all([
        getDocDataTransaction(transaction, roundRef),
        getDocDataTransaction(transaction, statesRef),
        getDocDataTransaction(transaction, gameRef)
    ]);

    let prevOrder = -1
    if (gameData.currentRound !== null) {
        const prevRoundRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', gameData.currentRound)
        const prevRoundData = await getDocDataTransaction(transaction, prevRoundRef)
        prevOrder = prevRoundData.order
    }
    const newOrder = prevOrder + 1

    if (roundData.dateStart && !roundData.dateEnd && gameData.currentQuestion) {
        await updateGameStatusTransaction(transaction, gameId, 'question_active')
        return
    }

    // await addSoundToQueueTransaction(transaction, gameId, 'super_mario_odyssey_moon')

    if (isRiddle(roundData.type) || roundData.type === 'quote' || roundData.type === 'enum') {
        // Set the status of every player to 'idle'
        const playersCollectionRef = collection(GAMES_COLLECTION_REF, gameId, 'players')
        const querySnapshot = await getDocs(query(playersCollectionRef))

        for (const playerDoc of querySnapshot.docs) {
            transaction.update(playerDoc.ref, {
                status: 'idle'
            })
        }
    }
    if (roundData.type === 'mcq') {
        const shuffledQuestionIds = shuffle(roundData.questions)
        transaction.update(roundRef, {
            questions: shuffledQuestionIds
        })
    }

    /* Update round object */
    transaction.update(roundRef, {
        dateStart: serverTimestamp(),
        order: newOrder,
        ...(roundData.type !== 'finale' ? { currentQuestionIdx: 0 } : {})
    })

    // If the round requires an order of chooser teams (e.g. OOO, MCQ) and it is the first round, find a random order for the chooser teams
    if (statesData.chooserOrder.length === 0 || statesData.chooserIdx === null) {
        const teamsCollectionRef = collection(GAMES_COLLECTION_REF, gameId, 'teams')
        const querySnapshot = await getDocs(query(teamsCollectionRef))

        // Create an array of random ids for the teams
        const teamIds = querySnapshot.docs.map(doc => doc.id)
        const shuffledTeamIds = shuffle(teamIds)

        transaction.update(statesRef, {
            chooserOrder: shuffledTeamIds,
        })
    }

    transaction.update(statesRef, {
        chooserIdx: 0,
    })

    const timerRef = doc(GAMES_COLLECTION_REF, gameId, 'realtime', 'timer')
    transaction.update(timerRef, {
        status: 'resetted'
    })

    await addSoundToQueueTransaction(transaction, gameId, 'super_mario_odyssey_moon')

    transaction.update(gameRef, {
        currentRound: roundId,
        currentQuestion: null,
        status: 'round_start', // Go to intro slide
    })
}

/* ==================================================================================================== */
// TRANSACTION
async function switchRoundQuestion(gameId, roundId, questionOrder) {
    if (!gameId) {
        throw new Error("No game ID has been provided!");
    }
    if (!roundId) {
        throw new Error("No round ID has been provided!");
    }

    try {
        await runTransaction(db, transaction =>
            switchRoundQuestionTransaction(transaction, gameId, roundId, questionOrder)
        );
        console.log(`Switched successfully to question ${questionOrder} in the round ${roundId}.`);
    } catch (error) {
        console.error("There was an error switching to the next question:", error);
        throw error;
    }
}
const switchRoundQuestionTransaction = async (
    transaction,
    gameId,
    roundId,
    questionOrder
) => {
    /* Game: fetch next question and reset every player's state */
    const roundRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId)
    const roundData = await getDocDataTransaction(transaction, roundRef)

    const questionId = roundData.questions[questionOrder]
    const questionRef = doc(QUESTIONS_COLLECTION_REF, questionId)
    const questionData = await getDocDataTransaction(transaction, questionRef)

    const realtimeDocRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId)

    if (questionData.type !== 'blindtest') {
        await addSoundToQueueTransaction(transaction, gameId, 'skyrim_skill_increase')
    }

    if (questionData.type === 'mcq') {
        const gameStatesRef = doc(GAMES_COLLECTION_REF, gameId, 'realtime', 'states')
        const gameStatesData = await getDocDataTransaction(transaction, gameStatesRef)
        const { chooserOrder, chooserIdx } = gameStatesData
        const chooserTeamId = chooserOrder[chooserIdx]

        if (questionOrder > 0) {
            const newChooserIdx = getNextCyclicIndex(chooserIdx, chooserOrder.length)
            const newChooserTeamId = chooserOrder[newChooserIdx]
            transaction.update(realtimeDocRef, {
                teamId: newChooserTeamId,
            })
            transaction.update(gameStatesRef, {
                chooserIdx: newChooserIdx
            })
            const playersCollectionRef = collection(GAMES_COLLECTION_REF, gameId, 'players')
            const newChooserPlayersQuerySnapshot = await getDocs(query(playersCollectionRef, where('teamId', '==', newChooserTeamId)))
            for (const playerDoc of newChooserPlayersQuerySnapshot.docs) {
                transaction.update(playerDoc.ref, {
                    status: 'focus'
                })
            }
            const prevChooserPlayersQuerySnapshot = await getDocs(query(playersCollectionRef, where('teamId', '==', chooserTeamId)))
            for (const playerDoc of prevChooserPlayersQuerySnapshot.docs) {
                transaction.update(playerDoc.ref, {
                    status: 'idle'
                })
            }
        } else {
            transaction.update(realtimeDocRef, {
                teamId: chooserTeamId,
            })
        }
    }

    if (questionData.type === 'enum') {
        await updateTimerTransaction(transaction, gameId, {
            status: 'resetted',
            duration: questionData.details.thinkingTime,
            forward: false
        })
    }

    if (questionData.type === 'odd_one_out' || questionData.type === 'matching') {
        const gameStatesRef = doc(GAMES_COLLECTION_REF, gameId, 'realtime', 'states')
        transaction.update(gameStatesRef, {
            chooserIdx: 0
        })
    }

    transaction.update(realtimeDocRef, {
        dateStart: serverTimestamp(),
    })

    transaction.update(roundRef, {
        currentQuestionIdx: questionOrder,
    })

    const gameRef = doc(GAMES_COLLECTION_REF, gameId)
    transaction.update(gameRef, {
        currentQuestion: questionId,
        status: 'question_active'
    })
}

/* ==================================================================================================== */
/**
 * round_start -> question_active
 */
// TRANSACTION
export async function startRoundFirstQuestion(gameId, roundId) {
    await switchRoundQuestion(gameId, roundId, 0)
}

/* ==================================================================================================== */
/**
 * question_end -> question_active or
 * question_end -> round_end
 */
// TRANSACTION
export async function handleRoundQuestionEnd(gameId, roundId) {
    if (!gameId) {
        throw new Error("No game ID has been provided!");
    }
    if (!roundId) {
        throw new Error("No round ID has been provided!");
    }

    try {
        await runTransaction(db, async (transaction) =>
            handleRoundQuestionEndTransaction(transaction, gameId, roundId)
        )
    } catch (error) {
        console.error("There was an error handling the end of the question:", error);
        throw error;
    }
}


const handleRoundQuestionEndTransaction = async (
    transaction,
    gameId,
    roundId,
) => {
    const roundRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId)
    const roundData = await getDocDataTransaction(transaction, roundRef)
    const isRoundEnd = roundData.currentQuestionIdx === roundData.questions.length - 1

    await (isRoundEnd ?
        endRoundTransaction(transaction, gameId, roundId) : /* End of round */
        switchRoundNextQuestionTransaction(transaction, gameId, roundId) /* Prepare the next question */
    )
}

/**
 * question_end -> question_active
 * Prepare the next question
 */
// TRANSACTION
export async function switchRoundNextQuestion(gameId, roundId) {
    if (!gameId) {
        throw new Error("No game ID has been provided!");
    }
    if (!roundId) {
        throw new Error("No round ID has been provided!");
    }

    try {
        await runTransaction(db, async (transaction) =>
            switchRoundNextQuestionTransaction(transaction, gameId, roundId)
        )
        console.log(`Switched successfully to the next question in the round ${roundId}.`);
    } catch (error) {
        console.error("There was an error switching to the next question in the round:", error);
        throw error;
    }
}

const switchRoundNextQuestionTransaction = async (
    transaction,
    gameId,
    roundId,
) => {
    const roundRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId)
    const roundData = await getDocDataTransaction(transaction, roundRef)

    await switchRoundQuestionTransaction(transaction, gameId, roundId, roundData.currentQuestionIdx + 1)

    const timerRef = doc(GAMES_COLLECTION_REF, gameId, 'realtime', 'timer')
    transaction.update(timerRef, {
        status: 'resetted'
    })

    if (roundData.type !== 'mcq') {
        // Set the status of every player to 'idle'
        const playersCollectionRef = collection(GAMES_COLLECTION_REF, gameId, 'players')
        const querySnapshot = await getDocs(query(playersCollectionRef))
        for (const playerDoc of querySnapshot.docs) {
            // await updatePlayerStatus(gameId, playerDoc.id, newStatus)
            transaction.update(playerDoc.ref, {
                status: 'idle'
            })
        }
    }

    const readyDocRef = doc(GAMES_COLLECTION_REF, gameId, 'realtime', 'ready')
    transaction.update(readyDocRef, {
        numReady: 0
    })
}


/* ==================================================================================================== */

/**
 * question_end -> round_end
 */
// TRANSACTION
export async function endRound(gameId, roundId) {
    if (!gameId) {
        throw new Error("No game ID has been provided!");
    }
    if (!roundId) {
        throw new Error("No round ID has been provided!");
    }
    try {
        // TRANSACTION
        await runTransaction(db, transaction =>
            endRoundTransaction(transaction, gameId, roundId)
        );
        console.log("Round successfully ended.");
    } catch (error) {
        console.error("There was an error ending the round:", error);
        throw error;
    }
}
const endRoundTransaction = async (
    transaction,
    gameId,
    roundId,
) => {
    const gameScoresRef = doc(GAMES_COLLECTION_REF, gameId, 'realtime', 'scores')
    const roundRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId)
    const roundScoresRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'realtime', 'scores')

    const [gameScoresData, roundData, roundScoresData] = await Promise.all([
        getDocDataTransaction(transaction, gameScoresRef),
        getDocDataTransaction(transaction, roundRef),
        getDocDataTransaction(transaction, roundScoresRef)
    ]);

    const { scores: currentGlobalScores, scoresProgress: currentGlobalScoresProgress } = gameScoresData;
    // currentGlobalScores:         {team1: globalScore1, team2: globalScore2, ...}
    // currentGlobalScoresProgress: {team1: {round1: roundScore11, round2: roundScore21}, team2: {round1: roundScore12, round2:roundScore22}, ...}

    const { rewards: roundRewards, questions } = roundData; // e.g., [3, 2, 1]
    const { scores: roundScores, scoresProgress: currentRoundScoresProgress } = roundScoresData; // {team1: roundScore1, team2: roundScore2, ...}


    // Sort the UNIQUE scores according to the notion of "winner first" 
    const sortedUniqueRoundScores = sortScores(roundScores, sortAscendingRoundScores(roundData.type));

    // Sort the teams accordingly and assign a reward for each
    const updatedGlobalScores = { ...currentGlobalScores };
    const roundSortedTeams = sortedUniqueRoundScores.map((score, index) => {
        const teamsWithThisScore = Object.keys(roundScores).filter(teamId => roundScores[teamId] === score);
        const reward = index < roundRewards.length ? roundRewards[index] : 0;
        teamsWithThisScore.forEach(teamId => updatedGlobalScores[teamId] = (updatedGlobalScores[teamId] || 0) + reward);
        return { score, reward, teams: teamsWithThisScore };
    });

    // Reconstruct the missing scores for each team
    let filledRoundProgress = {}
    Object.keys(roundScores).forEach(teamId => {
        const teamRoundProgress = currentRoundScoresProgress[teamId] || {};
        let teamScores = {};
        for (const [idx, questionId] of questions.entries()) {
            const scoreAtQuestion = teamRoundProgress[questionId] || null;
            if (scoreAtQuestion != null) {
                teamScores[questionId] = scoreAtQuestion;
                continue;
            }
            if (idx === 0) {
                teamScores[questionId] = 0;
                continue;
            }
            const previousQuestionId = questions[idx - 1];
            teamScores[questionId] = teamScores[previousQuestionId];
        }
        filledRoundProgress[teamId] = teamScores;
    })

    let teamsScoresSequences = {}
    for (const [teamId, teamProgress] of Object.entries(filledRoundProgress)) {
        teamsScoresSequences[teamId] = roundData.questions.map(questionId => teamProgress[questionId]);
    }

    const sortedUpdatedGameScores = sortScores(updatedGlobalScores, false);
    const gameSortedTeams = sortedUpdatedGameScores.map(score => {
        const teamsWithThisScore = Object.keys(updatedGlobalScores).filter(teamId => updatedGlobalScores[teamId] === score);
        return { score, teams: teamsWithThisScore };
    });

    // Create a updatedGlobalScoresProgress object that is equal to currentProgress but with an entry whose key is round and value is updatedGlobalScores[teamId] for every teamId
    const updatedGlobalScoresProgress = Object.keys(updatedGlobalScores).reduce((progress, teamId) => {
        progress[teamId] = {
            ...currentGlobalScoresProgress[teamId],
            [roundId]: updatedGlobalScores[teamId]
        };
        return progress;
    }, {});

    // updatedChooserOrder array is the flattened array of the teams in roundSortedTeams, in reverse order
    // slice() is used to create a copy of the roundSortedTeams array
    const updatedChooserOrder = roundSortedTeams.slice().reverse().flatMap(({ teams }) => shuffle(teams));

    let rankingDiffs = null
    if (roundData.order > 0) {
        const roundsRef = collection(GAMES_COLLECTION_REF, gameId, 'rounds')
        const prevRoundSnapshot = await getDocs(query(roundsRef, where('order', '==', roundData.order - 1), limit(1)))
        const prevRound = prevRoundSnapshot.docs[0]
        const prevRoundScoresRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', prevRound.id, 'realtime', 'scores')
        const prevRoundScoresData = await getDocDataTransaction(transaction, prevRoundScoresRef);
        rankingDiffs = calculateRankDifferences(prevRoundScoresData.gameSortedTeams, gameSortedTeams)
    }

    /* =================================== WRITES =================================== */
    const timerRef = doc(GAMES_COLLECTION_REF, gameId, 'realtime', 'timer')
    transaction.update(timerRef, {
        status: 'resetted'
    })

    transaction.update(roundScoresRef, {
        roundSortedTeams,
        gameSortedTeams,
        rankingDiffs,
        scoresProgress: filledRoundProgress,
        teamsScoresSequences
    })
    transaction.update(gameScoresRef, {
        scores: updatedGlobalScores,
        scoresProgress: updatedGlobalScoresProgress,
    })

    // Set focus on chooser players, Set idle on all non-chooser players
    const playersCollectionRef = collection(GAMES_COLLECTION_REF, gameId, 'players')
    for (const [idx, teamId] of updatedChooserOrder.entries()) {
        const playersQuerySnapshot = await getDocs(query(playersCollectionRef, where('teamId', '==', teamId)))
        for (const playerDoc of playersQuerySnapshot.docs) {
            transaction.update(playerDoc.ref, {
                status: idx === 0 ? 'focus' : 'idle'
            })
        }
    }
    const gameStatesRef = doc(GAMES_COLLECTION_REF, gameId, 'realtime', 'states')
    transaction.update(gameStatesRef, {
        chooserIdx: 0,
        chooserOrder: updatedChooserOrder
    })

    const readyDocRef = doc(GAMES_COLLECTION_REF, gameId, 'realtime', 'ready')
    transaction.update(readyDocRef, {
        numReady: 0
    })

    /* End the round */
    transaction.update(roundRef, {
        dateEnd: serverTimestamp(),
    })
    await updateGameStatusTransaction(transaction, gameId, 'round_end')

    await addSoundToQueueTransaction(transaction, gameId, 'level-passed')
}


function calculateRankDifferences(prevRankings, newRankings) {
    const rankDiff = {};
    for (let i = 0; i < prevRankings.length; i++) {
        for (const teamId of prevRankings[i].teams) {
            const newIndex = newRankings.findIndex((item) => item.teams.includes(teamId));
            const diff = i - newIndex;
            rankDiff[teamId] = diff;
        }
    }
    return rankDiff;
}


/* ==================================================================================================== */
/**
 * round_start -> FINALE (finale_home)
 * 
 */
// BATCHED WRITE
export async function startFinaleRound(gameId, roundId) {
    const batch = writeBatch(db)

    const finaleRoundRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId)
    batch.update(finaleRoundRef, {
        dateStart: serverTimestamp(),
        status: 'finale_home'
    })

    const gameRef = doc(GAMES_COLLECTION_REF, gameId)
    batch.update(gameRef, {
        status: 'finale'
    })

    const queueCollectionRef = collection(GAMES_COLLECTION_REF, gameId, 'realtime', 'sounds', 'queue')
    const newSoundDocument = doc(queueCollectionRef);
    batch.set(newSoundDocument, {
        timestamp: serverTimestamp(),
        filename: 'ui-confirmation-alert-b2',
    });

    await batch.commit()
}