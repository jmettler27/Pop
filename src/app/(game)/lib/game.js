"use server";

import { db } from '@/lib/firebase/firebase'
import { GAMES_COLLECTION_REF, QUESTIONS_COLLECTION_REF } from '@/lib/firebase/firestore'
import {
    collection,
    deleteField,
    doc,
    getDocs,
    query,
    runTransaction,
    updateDoc,
    where,
} from 'firebase/firestore'

import { resetAllRounds, resetAllRoundsTransaction } from '@/app/(game)/lib/round';
import { getInitTeamScores, initGameScores } from '@/app/(game)/lib/scores';
import { updateAllPlayersStatuses } from '@/app/(game)/lib/players';
import { initGameChooser } from '@/app/(game)/lib/chooser';
import { getDocData, getDocDataTransaction } from '@/app/(game)/lib/utils';
import { clearSounds } from '@/app/(game)/lib/sounds';
import { resetTimer } from '@/app/(game)/lib/timer';
import { shuffle } from '@/lib/utils/arrays';

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
        await runTransaction(db, transaction =>
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

    const [teamsQuerySnapshot, playersQuerySnapshot, queueQuerySnapshot] = await Promise.all([
        getDocs(query(teamsCollectionRef)),
        getDocs(query(playersCollectionRef)),
        getDocs(query(queueCollectionRef))
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
    const timerDocRef = doc(GAMES_COLLECTION_REF, gameId, 'realtime', 'timer')
    transaction.update(timerDocRef, {
        status: 'resetted',
        duration: 5,
        forward: false
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


    for (const playerDoc of playersQuerySnapshot.docs) {
        transaction.update(playerDoc.ref, { status: 'idle' })
    }

    // Clear sounds
    for (const doc of queueQuerySnapshot.docs) {
        transaction.delete(doc.ref)
    }
}


/* ==================================================================================================== */
export async function updateQuestion(questionId) {
    // const metadataFieldNames = ['type', 'topic', 'lang', 'createdAt', 'createdBy', 'approved']
    try {
        await runTransaction(db, transaction =>
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
    // const themeId = 'R9ZM0YoYyGgPVY7taJAC'

    // const themeDocRef = doc(QUESTIONS_COLLECTION_REF, themeId)
    // const themeData = await getDocDataTransaction(transaction, themeDocRef)

    // const newThemeDocRef = doc(collection(QUESTIONS_COLLECTION_REF))
    // transaction.set(newThemeDocRef, { ...themeData })

    // const sectionsCollectionRef = collection(QUESTIONS_COLLECTION_REF, themeId, 'sections')
    // const sectionsSnapshot = await getDocs(query(sectionsCollectionRef))
    // for (const sectionDoc of sectionsSnapshot.docs) {
    //     const sectionId = sectionDoc.id
    //     const sectionData = sectionDoc.data()

    //     const { order, ...rest } = sectionData
    //     const newSectionDocRef = doc(QUESTIONS_COLLECTION_REF, newThemeDocRef.id, 'sections', sectionId)
    //     transaction.set(newSectionDocRef, { ...rest })

    //     const { questions } = rest
    //     const updatedQuestions = questions.map(elem => {
    //         const { question, status, ...rest } = elem
    //         return {
    //             ...rest,
    //             title: rest.title || question
    //         }
    //     })
    //     transaction.update(newSectionDocRef, { questions: updatedQuestions })
    // }
    const questionDocRef = doc(QUESTIONS_COLLECTION_REF, questionId)
    transaction.update(questionDocRef, {
        createdBy: "dE1ItazZqaoBjChy7NN8"
    })
}

export async function updateQuestions() {

    try {
        const q = query(QUESTIONS_COLLECTION_REF, where('type', '==', 'mcq'), where('topic', '==', 'anime_manga'));
        const querySnapshot = await getDocs(q)

        for (const questionDoc of querySnapshot.docs) {
            await runTransaction(db, transaction =>
                updateQuestionTransaction(transaction, questionDoc.id)
            )
            // console.log(questionDoc.id)
        }
        console.log("Matching submission handled successfully.");
    } catch (error) {
        console.error("There was an error handling the matching submission:", error);
        throw error;
    }
}
