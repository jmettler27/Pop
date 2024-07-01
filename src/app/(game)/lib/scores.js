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