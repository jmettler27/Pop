"use server";

import { firestore } from '@/lib/firebase/firebase'
import { GAMES_COLLECTION_REF, QUESTIONS_COLLECTION_REF } from '@/lib/firebase/firestore'
import {
    collection,
    doc,
    getDocs,
    query,
    runTransaction,
    updateDoc,
    where,
} from 'firebase/firestore'

import { resetAllRoundsTransaction } from '@/app/(game)/lib/round';
import { getDocData, getDocDataTransaction, updateGameStatusTransaction } from '@/app/(game)/lib/utils';
import { getRandomElement, shuffle } from '@/lib/utils/arrays';
import { updateTimerTransaction } from './timer';
import { READY_COUNTDOWN_SECONDS } from '@/lib/utils/time';
import { addSoundToQueueTransaction } from './sounds';

/* ==================================================================================================== */
// WRITE
export async function updateGameFields(gameId, fieldsToUpdate) {
    const gameRef = doc(GAMES_COLLECTION_REF, gameId)
    const updateObject = { ...fieldsToUpdate }

    await updateDoc(gameRef, updateObject)
    console.log(`Game ${gameId}:`, fieldsToUpdate)
}


// Game
// WRITE
export async function updateGameStatus(gameId, newStatus) {
    await updateGameFields(gameId, { status: newStatus })
}

// WRITE
export async function updateGameStates(gameId, fieldsToUpdate) {
    const statesRef = doc(GAMES_COLLECTION_REF, gameId, 'realtime', 'states')
    const updateObject = { ...fieldsToUpdate }

    await updateDoc(statesRef, updateObject)
    console.log(`Game ${gameId}, States:`, fieldsToUpdate)
}

// READ
export async function getGameData(gameId) {
    return getDocData('games', gameId);
}

// READ
export async function getGameStatesData(gameId) {
    return getDocData('games', gameId, 'realtime', 'states');
}


/* ==================================================================================================== */
// TRANSACTION
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

    const [teamsQuerySnapshot, playersQuerySnapshot, queueQuerySnapshot, organizersQuerySnapshot] = await Promise.all([
        getDocs(query(teamsCollectionRef)),
        getDocs(query(playersCollectionRef)),
        getDocs(query(queueCollectionRef)),
        getDocs(query(organizersCollectionRef))
    ])
    const { teamIds, initTeamGameScores, initTeamGameScoresProgress } = teamsQuerySnapshot.docs.reduce((acc, teamDoc) => {
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
    // const managerId = getRandomElement(organizersQuerySnapshot.docs).id
    const managerId = organizersQuerySnapshot.docs[0].id
    await updateTimerTransaction(transaction, gameId, {
        status: 'reset',
        duration: READY_COUNTDOWN_SECONDS,
        forward: false,
        authorized: false,
        managedBy: managerId,
    })

    // Init chooser
    const shuffledTeamIds = shuffle(teamIds)
    const gameStatesDocRef = doc(GAMES_COLLECTION_REF, gameId, 'realtime', 'states')
    transaction.update(gameStatesDocRef, {
        chooserIdx: 0,
        chooserOrder: shuffledTeamIds
    })

    // Init global scores
    const gameScoresRef = doc(GAMES_COLLECTION_REF, gameId, 'realtime', 'scores')
    transaction.set(gameScoresRef, {
        scores: initTeamGameScores,
        scoresProgress: initTeamGameScoresProgress,
    })

    const gameReadyDocRef = doc(GAMES_COLLECTION_REF, gameId, 'realtime', 'ready')
    transaction.set(gameReadyDocRef, {
        numPlayers: playersQuerySnapshot.size,
        numReady: 0
    })


    for (const playerDoc of playersQuerySnapshot.docs) {
        transaction.update(playerDoc.ref, { status: 'idle' })
    }

    // Clear sounds
    for (const doc of queueQuerySnapshot.docs) {
        transaction.delete(doc.ref)
    }
}

export async function switchAuthorizePlayers(gameId, authorized = null) {
    if (!gameId) {
        throw new Error("No game ID has been provided!");
    }

    try {
        await runTransaction(firestore, transaction =>
            switchAuthorizePlayersTransaction(transaction, gameId, authorized)
        )
    }
    catch (error) {
        console.error("There was an error authorizing the players:", error);
        throw error;
    }
}

export const switchAuthorizePlayersTransaction = async (
    transaction,
    gameId,
    authorized = null
) => {
    const timerDocRef = doc(GAMES_COLLECTION_REF, gameId, 'realtime', 'timer')

    let newVal = authorized
    if (authorized === null) {
        const timerData = await getDocDataTransaction(transaction, timerDocRef)
        newVal = !timerData.authorized
    }

    updateTimerTransaction(transaction, gameId, { authorized: newVal })
    if (newVal === true)
        addSoundToQueueTransaction(transaction, gameId, 'minecraft_button_plate')
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
    await resetGameTransaction(transaction, gameId)
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
    const questionDocRef = doc(QUESTIONS_COLLECTION_REF, questionId)
    const questionData = await getDocDataTransaction(transaction, questionDocRef)
    const { answer, image, title } = questionData.details


    // if answer is a string, return
    if (typeof answer !== 'string') {
        return
    }
    let description = null
    let source = null

    const answerParts = answer.split(' - ')

    if (answerParts.length === 1) {
        source = answerParts[0]
    } else if (answerParts.length === 2) {
        description = answerParts[0]
        source = answerParts[1]
    }


    transaction.update(questionDocRef, {
        details: {
            image,
            title,
            answer: {
                source,
                description
            },
        }
    })
}

export async function updateQuestions() {

    try {
        const q = query(QUESTIONS_COLLECTION_REF, where('type', '==', 'image'), where('topic', '==', 'video_game'));
        const querySnapshot = await getDocs(q)

        for (const questionDoc of querySnapshot.docs) {
            await runTransaction(firestore, transaction =>
                updateQuestionTransaction(transaction, questionDoc.id)
            )
            // console.log(questionDoc.id)
        }
    } catch (error) {
        console.error("There was an error updating the questions", error);
        throw error;
    }
}
