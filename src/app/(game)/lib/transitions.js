"use server";

import { db } from '@/lib/firebase/firebase'
import {
    collection,
    query,
    where,
    getDocs,
    doc,
    serverTimestamp,
    runTransaction,
} from 'firebase/firestore'

import { updateGameFields } from '@/app/(game)/lib/game';
import { getDocDataTransaction, updateGameStatusTransaction } from './utils';
import { addSoundToQueueTransaction } from './sounds';
import { GAMES_COLLECTION_REF } from '@/lib/firebase/firestore';
import { resetGameChooserTransaction } from './chooser';
import { shuffle } from '@/lib/utils/arrays';


/**
 * game_start -> game_home
 * 
 */
// TRANSACTION
export async function startGame(gameId, organizerId) {
    if (!gameId) {
        throw new Error("No game ID has been provided!");
    }
    if (!organizerId) {
        throw new Error("No organizer ID has been provided!");
    }

    try {
        await runTransaction(db, transaction =>
            startGameTransaction(transaction, gameId, organizerId)
        );
        console.log("Succesfully switched to game_home.");
    } catch (error) {
        console.error("There was an error starting the game:", error);
        throw error;
    }
}

const startGameTransaction = async (
    transaction,
    gameId,
    organizerId
) => {
    const teamsCollectionRef = collection(GAMES_COLLECTION_REF, gameId, 'teams')
    const teamsQuerySnapshot = await getDocs(query(teamsCollectionRef))

    const { teamIds, initTeamGameScores, initTeamGameScoresProgress } = teamsQuerySnapshot.docs.reduce((acc, teamDoc) => {
        acc.teamIds.push(teamDoc.id);
        acc.initTeamGameScores[teamDoc.id] = 0;
        acc.initTeamGameScoresProgress[teamDoc.id] = {};
        return acc;
    }, { teamIds: [], initTeamGameScores: {}, initTeamGameScoresProgress: {} });


    const shuffledTeamIds = shuffle(teamIds)
    const chooserTeamId = shuffledTeamIds[0]

    const playersCollectionRef = collection(GAMES_COLLECTION_REF, gameId, 'players')
    const chooserPlayersQuerySnapshot = await getDocs(query(playersCollectionRef, where('teamId', '==', chooserTeamId)))

    const gameRef = doc(GAMES_COLLECTION_REF, gameId)
    transaction.update(gameRef, {
        status: 'game_home',
        dateStart: serverTimestamp(),
    })

    for (const playerDoc of chooserPlayersQuerySnapshot.docs) {
        transaction.update(playerDoc.ref, {
            status: 'focus'
        })
    }

    const gameStatesDocRef = doc(GAMES_COLLECTION_REF, gameId, 'realtime', 'states')
    transaction.update(gameStatesDocRef, {
        chooserIdx: 0,
        chooserOrder: shuffledTeamIds
    })

    const gameScoresRef = doc(GAMES_COLLECTION_REF, gameId, 'realtime', 'scores')
    transaction.set(gameScoresRef, {
        scores: initTeamGameScores,
        scoresProgress: initTeamGameScoresProgress,
    })

    await addSoundToQueueTransaction(transaction, gameId, 'ui-confirmation-alert-b2')
}

/* ==================================================================================================== */
/**
 * round_end -> game_home
 * 
 */
// TRANSACTION
export async function roundEndToGameHome(gameId) {
    if (!gameId) {
        throw new Error("No game ID has been provided!");
    }

    try {
        await runTransaction(db, transaction =>
            roundEndToGameHomeTransaction(transaction, gameId)
        );
        console.log("Succesfully switched to game_home.");
    } catch (error) {
        console.error("There was an error starting the game:", error);
        throw error;
    }
}

const roundEndToGameHomeTransaction = async (
    transaction,
    gameId,
) => {
    await addSoundToQueueTransaction(transaction, gameId, 'GAME', 'ui-confirmation-alert-b2')

    await updateGameStatusTransaction(transaction, gameId, 'game_home')
}

/* ==================================================================================================== */
// WRITE
export async function endGame(gameId) {
    await updateGameFields(gameId, {
        status: 'game_end'
    })
}
