"use server";

import { firestore } from '@/lib/firebase/firebase'
import {
    collection,
    query,
    getDocs,
    doc,
    updateDoc,
    increment,
    runTransaction,
} from 'firebase/firestore'

import { getDocData, getDocDataTransaction } from '@/app/(game)/lib/utils';
import { GAMES_COLLECTION_REF } from '@/lib/firebase/firestore';


export async function getInitTeamScores(gameId) {
    const teamsCollectionRef = collection(GAMES_COLLECTION_REF, gameId, 'teams')
    const teamsSnapshot = await getDocs(query(teamsCollectionRef))

    const initTeamScores = {}
    for (const teamDoc of teamsSnapshot.docs) {
        initTeamScores[teamDoc.id] = 0
    }
    return initTeamScores
}

export async function getGameScoresData(gameId) {
    return getDocData('games', gameId, 'realtime', 'scores')
}

/* ==================================================================================================== */
export async function initGameScores(gameId) {
    if (!gameId) {
        throw new Error("No game ID has been provided!");
    }
    try {
        await runTransaction(firestore, transaction =>
            initGameScoresTransaction(transaction, gameId)
        )
    }
    catch (error) {
        console.error("There was an error initializing the game scores:", error);
        throw error;
    }
}

const initGameScoresTransaction = async (
    transaction,
    gameId
) => {
    const teamsCollectionRef = collection(GAMES_COLLECTION_REF, gameId, 'teams')
    const teamsSnapshot = await getDocs(query(teamsCollectionRef))

    const initTeamGameScores = {}
    const initTeamGameScoresProgress = {}
    for (const teamDoc of teamsSnapshot.docs) {
        initTeamGameScores[teamDoc.id] = 0
        initTeamGameScoresProgress[teamDoc.id] = {}
    }

    const gameScoresRef = doc(GAMES_COLLECTION_REF, gameId, 'realtime', 'scores')
    transaction.set(gameScoresRef, {
        scores: initTeamGameScores,
        scoresProgress: initTeamGameScoresProgress,
    })
}


export async function initRoundScores(gameId, roundId) {
    const initTeamRoundScores = await getInitTeamScores(gameId)

    updateRoundScores(gameId, roundId, {
        scores: initTeamRoundScores,
        scoresProgress: {}, //initTeamRoundScoresProgress,
        teamsScoresSequences: {},//initTeamsScoresSequences,
        roundSortedTeams: [],
        gameSortedTeams: []
    })
}


// WRITE
async function updateRoundScores(gameId, roundId, fieldsToUpdate) {
    const scoresRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'realtime', 'scores')
    const updateObject = { ...fieldsToUpdate }

    await updateDoc(scoresRef, updateObject)
    console.log(`Game ${gameId}, Round ${roundId}, Scores:`, fieldsToUpdate)
}

// WRITE
export async function updateTeamRoundScore(gameId, roundId, teamId, incrementBy) {
    await updateRoundScores(gameId, roundId, {
        [`scores.${teamId}`]: increment(incrementBy)
    })
}

// READ
export async function getRoundScoresData(gameId, roundId) {
    return getDocData('games', gameId, 'rounds', roundId, 'realtime', 'scores')
}

/* ==================================================================================================== */
export const increaseRoundTeamScoreTransaction = async (
    transaction,
    gameId,
    roundId,
    questionId,
    teamId = null,
    points = 0
) => {
    const roundScoresRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'realtime', 'scores')
    const roundScoresData = await getDocDataTransaction(transaction, roundScoresRef)

    const { scores: currentRoundScores, scoresProgress: currentRoundProgress } = roundScoresData

    const newRoundProgress = {}
    for (const tid of Object.keys(currentRoundScores)) {
        newRoundProgress[tid] = {
            ...currentRoundProgress[tid],
            [questionId]: currentRoundScores[tid] + (tid === teamId) * points
        }
    }
    transaction.update(roundScoresRef, {
        [`scores.${teamId}`]: increment(points),
        scoresProgress: newRoundProgress
    })
}

export const increaseGlobalTeamScoreTransaction = async (
    transaction,
    gameId,
    roundId,
    teamId = null,
    points = 0
) => {
    const gameScoresRef = doc(GAMES_COLLECTION_REF, gameId, 'realtime', 'scores')
    const gameScoresData = await getDocDataTransaction(transaction, gameScoresRef)

    const { scores: currentGameScores, scoresProgress: currentGameProgress } = gameScoresData

    const newGameProgress = {}
    for (const tid of Object.keys(currentGameScores)) {
        newGameProgress[tid] = {
            ...currentGameProgress[tid],
            [roundId]: currentGameScores[tid] + (tid === teamId) * points
        }
    }
    transaction.update(gameScoresRef, {
        [`scores.${teamId}`]: increment(points),
        scoresProgress: newGameProgress
    })
}

export const decreaseGlobalTeamScoreTransaction = async (
    transaction,
    gameId,
    roundId,
    questionId,
    penalty,
    teamId = null,
) => {

    const gameScoresRef = doc(GAMES_COLLECTION_REF, gameId, 'realtime', 'scores')
    const roundScoresRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'realtime', 'scores')

    const [gameScoresData, roundScoresData] = await Promise.all([
        getDocDataTransaction(transaction, gameScoresRef),
        getDocDataTransaction(transaction, roundScoresRef)
    ])

    // Decrease the team's global score by the penalty    
    const mistakePenalty = penalty
    const { scores: currentGameScores, scoresProgress: currentGameProgress } = gameScoresData
    const newGameProgress = {}
    for (const tid of Object.keys(currentGameScores)) {
        newGameProgress[tid] = {
            ...currentGameProgress[tid],
            [roundId]: currentGameScores[tid] + (tid === teamId) * mistakePenalty
        }
    }
    transaction.update(gameScoresRef, {
        [`scores.${teamId}`]: increment(mistakePenalty),
        scoresProgress: newGameProgress
    })

    // Increase the team's round "score" to 1. In this context, 1 is rather an increment to the counter of mistakes of the team in the round, that a point added to round score
    const { scores: currentRoundScores, scoresProgress: currentRoundProgress } = roundScoresData
    const newRoundProgress = {}
    for (const tid of Object.keys(currentRoundScores)) {
        newRoundProgress[tid] = {
            ...currentRoundProgress[tid],
            [questionId]: currentRoundScores[tid] + (tid === teamId)
        }
    }
    transaction.update(roundScoresRef, {
        [`scores.${teamId}`]: increment(1),
        scoresProgress: newRoundProgress
    })
}