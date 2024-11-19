"use server";

import { firestore } from '@/lib/firebase/firebase'
import { GAMES_COLLECTION_REF, QUESTIONS_COLLECTION_REF } from '@/lib/firebase/firestore'
import {
    collection,
    doc,
    getDocs,
    query,
    runTransaction,
    serverTimestamp,
    updateDoc,
    where,
} from 'firebase/firestore'

import { shuffle } from '@/lib/utils/arrays';
import { READY_COUNTDOWN_SECONDS } from '@/lib/utils/time';

import { resetAllRoundsTransaction } from '@/app/(game)/lib/round';
import { getDocData, getDocDataTransaction, updateGameStatusTransaction } from '@/app/(game)/lib/utils';
import { updateTimerTransaction } from '@/app/(game)/lib/timer';
import { addSoundEffectTransaction } from '@/app/(game)/lib/sounds';


export async function updateGameFields(gameId, fieldsToUpdate) {
    const gameRef = doc(GAMES_COLLECTION_REF, gameId)
    const updateObject = { ...fieldsToUpdate }

    await updateDoc(gameRef, updateObject)
    console.log(`Game ${gameId}:`, fieldsToUpdate)
}


export async function updateGameStatus(gameId, newStatus) {
    await updateGameFields(gameId, { status: newStatus })
}

export async function updateGameStates(gameId, fieldsToUpdate) {
    const gameStatesRef = doc(GAMES_COLLECTION_REF, gameId, 'realtime', 'states')
    const updateObject = { ...fieldsToUpdate }

    await updateDoc(gameStatesRef, updateObject)
    console.log(`Game ${gameId}, States:`, fieldsToUpdate)
}

export async function getGameData(gameId) {
    return getDocData('games', gameId);
}

export async function getGameStatesData(gameId) {
    return getDocData('games', gameId, 'realtime', 'states');
}


/* ==================================================================================================== */
export async function resetGame(gameId) {
    if (!gameId) {
        throw new Error("No game ID has been provided!");
    }

    try {
        await runTransaction(firestore, transaction =>
            resetGameTransaction(transaction, gameId)
        )
        console.log(`Game ${gameId} reset successfully.`);
    }
    catch (error) {
        console.error("There was an error resetting the game:", error);
        throw error;
    }
}

const resetGameTransaction = async (
    transaction,
    gameId
) => {
    const teamsCollectionRef = collection(GAMES_COLLECTION_REF, gameId, 'teams')
    const playersCollectionRef = collection(GAMES_COLLECTION_REF, gameId, 'players')
    const queueCollectionRef = collection(GAMES_COLLECTION_REF, gameId, 'realtime', 'sounds', 'queue')
    const organizersCollectionRef = collection(GAMES_COLLECTION_REF, gameId, 'organizers')

    const [teamsSnapshot, playersSnapshot, queueSnapshot, organizersSnapshot] = await Promise.all([
        getDocs(query(teamsCollectionRef)),
        getDocs(query(playersCollectionRef)),
        getDocs(query(queueCollectionRef)),
        getDocs(query(organizersCollectionRef))
    ])
    const { teamIds, initTeamGameScores, initTeamGameScoresProgress } = teamsSnapshot.docs.reduce((acc, teamDoc) => {
        acc.teamIds.push(teamDoc.id);
        acc.initTeamGameScores[teamDoc.id] = 0;
        acc.initTeamGameScoresProgress[teamDoc.id] = {};
        return acc;
    }, { teamIds: [], initTeamGameScores: {}, initTeamGameScoresProgress: {} });

    await resetAllRoundsTransaction(transaction, gameId)

    // Reset game
    const gameRef = doc(GAMES_COLLECTION_REF, gameId)
    transaction.update(gameRef, {
        currentRound: null,
        currentQuestion: null,
        dateEnd: null,
        dateStart: null,
        status: 'game_start',
    })

    // Reset timer
    // const managerId = getRandomElement(organizersSnapshot.docs).id
    const managerId = organizersSnapshot.docs[0].id
    await updateTimerTransaction(transaction, gameId, {
        status: 'reset',
        duration: READY_COUNTDOWN_SECONDS,
        forward: false,
        authorized: false,
        managedBy: managerId,
    })

    // Init chooser
    const shuffledTeamIds = shuffle(teamIds)
    const gameStatesRef = doc(GAMES_COLLECTION_REF, gameId, 'realtime', 'states')
    transaction.update(gameStatesRef, {
        chooserIdx: 0,
        chooserOrder: shuffledTeamIds
    })

    // Init global scores
    const gameScoresRef = doc(GAMES_COLLECTION_REF, gameId, 'realtime', 'scores')
    transaction.set(gameScoresRef, {
        scores: initTeamGameScores,
        scoresProgress: initTeamGameScoresProgress,
    })

    const gameReadyRef = doc(GAMES_COLLECTION_REF, gameId, 'realtime', 'ready')
    transaction.set(gameReadyRef, {
        numPlayers: playersSnapshot.size,
        numReady: 0
    })


    for (const playerDoc of playersSnapshot.docs) {
        transaction.update(playerDoc.ref, { status: 'idle' })
    }

    // Clear sounds
    for (const doc of queueSnapshot.docs) {
        transaction.delete(doc.ref)
    }
}

export async function togglePlayerAuthorization(gameId, authorized = null) {
    if (!gameId) {
        throw new Error("No game ID has been provided!");
    }

    try {
        await runTransaction(firestore, transaction =>
            togglePlayerAuthorizationTransaction(transaction, gameId, authorized)
        )
    }
    catch (error) {
        console.error("There was an error authorizing the players:", error);
        throw error;
    }
}

export const togglePlayerAuthorizationTransaction = async (
    transaction,
    gameId,
    authorized = null
) => {
    const timerRef = doc(GAMES_COLLECTION_REF, gameId, 'realtime', 'timer')

    let newVal = authorized
    if (authorized === null) {
        const timerData = await getDocDataTransaction(transaction, timerRef)
        newVal = !timerData.authorized
    }
    await updateTimerTransaction(transaction, gameId, { authorized: newVal })
    if (newVal === true)
        await addSoundEffectTransaction(transaction, gameId, 'minecraft_button_plate')
}

export async function resumeEditing(gameId) {
    if (!gameId) {
        throw new Error("No game ID has been provided!");
    }

    try {
        await runTransaction(firestore, transaction =>
            resumeEditingTransaction(transaction, gameId)
        )
    }
    catch (error) {
        console.error("There was an error returning to editing the game:", error);
        throw error;
    }
}

const resumeEditingTransaction = async (
    transaction,
    gameId
) => {
    // await resetGameTransaction(transaction, gameId)
    await updateGameStatusTransaction(transaction, gameId, 'build')
}

/* ==================================================================================================== */
export async function updateQuestion(questionId) {
    // const metadataFieldNames = ['type', 'topic', 'lang', 'createdAt', 'createdBy', 'approved']
    try {
        await runTransaction(firestore, transaction =>
            updateQuestionTransaction(transaction, questionId)
        )
        console.log("Matching submission handled successfully.");
    } catch (error) {
        console.error("There was an error handling the matching submission:", error);
        throw error;
    }
}

const updateQuestionTransaction = async (
    transaction,
    questionId
) => {
    const questionRef = doc(QUESTIONS_COLLECTION_REF, questionId)
    const questionData = await getDocDataTransaction(transaction, questionRef)
    const { subtype, ...rest } = questionData.details

    const type = subtype === 'immediate' ? 'mcq' : 'nagui'

    // Change the type of the question to subtype
    transaction.update(questionRef, {
        type,
        details: rest
    })
}

export async function updateQuestions() {
    try {
        const q = query(QUESTIONS_COLLECTION_REF, where('type', '==', 'mcq'));
        const querySnapshot = await getDocs(q)

        for (const questionDoc of querySnapshot.docs) {
            await runTransaction(firestore, transaction =>
                updateQuestionTransaction(transaction, questionDoc.id)
            )
        }
    } catch (error) {
        console.error("There was an error updating the questions", error);
        throw error;
    }
}

/* ==================================================================================================== */
export async function updateQuestionManager(gameId, roundId, questionId, managedBy) {
    if (!gameId || !roundId || !questionId || !managedBy) {
        throw new Error("Missing required parameters!");
    }
    try {
        await runTransaction(firestore, transaction =>
            updateQuestionManagerTransaction(transaction, gameId, roundId, questionId, managedBy)
        )
        console.log("Matching submission handled successfully.");
    } catch (error) {
        console.error("There was an error handling the matching submission:", error);
        throw error;
    }
}

const updateQuestionManagerTransaction = async (
    transaction,
    gameId,
    roundId,
    questionId,
    managedBy
) => {
    const questionRealtimeRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId)
    transaction.update(questionRealtimeRef, { managedBy })
}

/* ==================================================================================================== */
export async function endGame(gameId) {
    if (!gameId) {
        throw new Error("No game ID has been provided!");
    }

    try {
        runTransaction(firestore, transaction =>
            endGameTransaction(transaction, gameId)
        )
    }
    catch (error) {
        console.error("There was an error ending the game:", error);
        throw error;
    }
}

const endGameTransaction = async (
    transaction,
    gameId
) => {
    const gameScoresRef = doc(GAMES_COLLECTION_REF, gameId, 'realtime', 'scores')
    const gameScoresData = await getDocDataTransaction(transaction, gameScoresRef)
    const { gameSortedTeams } = gameScoresData
    const winningTeamIds = gameSortedTeams[0].teams

    // Update the status of every player to 'correct' if their team has won, 'idle' otherwise
    const playersCollectionRef = collection(GAMES_COLLECTION_REF, gameId, 'players')
    const playersSnapshot = await getDocs(playersCollectionRef)
    for (const playerDoc of playersSnapshot.docs) {
        const playerData = playerDoc.data()
        const status = winningTeamIds.includes(playerData.teamId) ? 'correct' : 'idle'
        transaction.update(playerDoc.ref, { status })
    }

    const gameRef = doc(GAMES_COLLECTION_REF, gameId)
    transaction.update(gameRef, {
        dateEnd: serverTimestamp(),
    })
    await updateGameStatusTransaction(transaction, gameId, 'game_end')
    await addSoundEffectTransaction(transaction, gameId, 'ffxvi_victory_fanfare')
}