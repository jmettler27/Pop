"use server";

import { db } from '@/lib/firebase/firebase'
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


// READ
export async function getInitTeamScores(gameId) {
    const teamsCollectionRef = collection(GAMES_COLLECTION_REF, gameId, 'teams')
    const querySnapshot = await getDocs(query(teamsCollectionRef))
    // Create a map of all the team ids with value 0 
    const initTeamScores = {}
    for (const teamDoc of querySnapshot.docs) {
        initTeamScores[teamDoc.id] = 0
    }
    return initTeamScores
}

// READ
export async function getGameScoresData(gameId) {
    return getDocData('games', gameId, 'realtime', 'scores')
}

/* ==================================================================================================== */
// WRITE
async function updateGameScores(gameId, fieldsToUpdate) {
    const gameScoresRef = doc(GAMES_COLLECTION_REF, gameId, 'realtime', 'scores')
    const updateObject = { ...fieldsToUpdate }

    await updateDoc(gameScoresRef, updateObject)
    console.log(`Game ${gameId}, Scores:`, fieldsToUpdate)
}

// TRANSACTION
export async function initGameScores(gameId) {
    if (!gameId) {
        throw new Error("No game ID has been provided!");
    }
    try {
        await runTransaction(db, transaction =>
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
    const querySnapshot = await getDocs(query(teamsCollectionRef))

    const initTeamGameScores = {}
    const initTeamGameScoresProgress = {}
    for (const teamDoc of querySnapshot.docs) {
        initTeamGameScores[teamDoc.id] = 0
        initTeamGameScoresProgress[teamDoc.id] = {}
    }

    const gameScoresRef = doc(GAMES_COLLECTION_REF, gameId, 'realtime', 'scores')
    transaction.set(gameScoresRef, {
        scores: initTeamGameScores,
        scoresProgress: initTeamGameScoresProgress,
    })
}

// TRANSACTION
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

// TRANSACTION
async function addTeamRoundQuestionScore(gameId, roundId, questionId) {
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
            addTeamRoundQuestionScoreTransaction(transaction, gameId, roundId, questionId)
        );
    } catch (error) {
        console.error("There was an error adding a team round question score:", error);
        throw error;
    }
}

const addTeamRoundQuestionScoreTransaction = async (
    transaction,
    gameId,
    roundId,
    questionId
) => {
    const roundScoresRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'realtime', 'scores')
    const roundScoresData = await getDocDataTransaction(transaction, roundScoresRef)
    const { scores: currentScores, scoresProgress: currentProgress } = roundScoresData;

    // Create a newRoundScoresProgress object that is equal to roundScoresProgress but with an entry whose key is questionId and value is currentRoundScores[teamId] for every teamId
    const newProgress = {}
    for (const teamId of Object.keys(currentScores)) {
        // Add an entry whose key is questionId and value is currentRoundScores[teamId
        newProgress[teamId] = {
            ...currentProgress[teamId],
            [questionId]: currentScores[teamId]
        }
    }
    transaction.update(roundScoresRef, {
        scoresProgress: newProgress
    })
}