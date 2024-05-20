"use server";

import { firestore } from '@/lib/firebase/firebase'
import { collection, doc, getDocs, query, runTransaction } from 'firebase/firestore'

import { updateGameStates } from '@/app/(game)/lib/game';
import { getNextCyclicIndex, shuffle } from '@/lib/utils/arrays';
import { getDocDataTransaction, updateGameStatusTransaction } from './utils';
import { GAMES_COLLECTION_REF } from '@/lib/firebase/firestore';

/* ==================================================================================================== */
// WRITE
export async function initGameChooser(gameId) {
    if (!gameId) {
        throw new Error("No game ID has been provided!");
    }
    try {
        await runTransaction(firestore, transaction =>
            resetGameChooserTransaction(transaction, gameId)
        )
    }
    catch (error) {
        console.error("There was an error resetting the game chooser list:", error);
        throw error;
    }
}

export const resetGameChooserTransaction = async (
    transaction,
    gameId
) => {
    const teamsCollectionRef = collection(GAMES_COLLECTION_REF, gameId, 'teams')
    const querySnapshot = await getDocs(query(teamsCollectionRef))

    // Create an array of random ids for the teams
    const teamIds = querySnapshot.docs.map(doc => doc.id)
    const shuffledTeamIds = shuffle(teamIds)

    const gameStatesDocRef = doc(GAMES_COLLECTION_REF, gameId, 'realtime', 'states')
    transaction.update(gameStatesDocRef, {
        chooserIdx: 0,
        chooserOrder: shuffledTeamIds
    })
}

/* ==================================================================================================== */
//  TRANSACTION
export async function switchNextChooser(gameId) {
    if (!gameId) {
        throw new Error("No game ID has been provided!");
    }

    try {
        await runTransaction(firestore, transaction =>
            switchNextChooserTransaction(transaction, gameId)
        )
    } catch (error) {
        console.error("There was an error switching to the next chooser:", error);
        throw error;
    }
}

export const switchNextChooserTransaction = async (
    transaction,
    gameId
) => {
    const gameStatesRef = doc(GAMES_COLLECTION_REF, gameId, 'realtime', 'states')
    const gameStatesData = await getDocDataTransaction(transaction, gameStatesRef)
    const { chooserOrder, chooserIdx } = gameStatesData

    const newChooserIdx = getNextCyclicIndex(chooserIdx, chooserOrder.length)
    transaction.update(gameStatesRef, {
        chooserIdx: newChooserIdx
    })
    console.log("New chooser team:", chooserOrder[newChooserIdx])
}