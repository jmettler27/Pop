"use server";

import { firestore } from '@/lib/firebase/firebase'
import { collection, doc, getDocs, query, runTransaction, where } from 'firebase/firestore'

import { getNextCyclicIndex, shuffle } from '@/lib/utils/arrays';
import { getDocDataTransaction } from './utils';
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
    const teamsSnapshot = await getDocs(query(teamsCollectionRef))

    // Create an array of random ids for the teams
    const teamIds = teamsSnapshot.docs.map(doc => doc.id)
    const shuffledTeamIds = shuffle(teamIds)

    const gameStatesRef = doc(GAMES_COLLECTION_REF, gameId, 'realtime', 'states')
    transaction.update(gameStatesRef, {
        chooserIdx: 0,
        chooserOrder: shuffledTeamIds
    })
}

/* ==================================================================================================== */
//  TRANSACTION
export async function switchNextChooser(gameId, focus = true) {
    if (!gameId) {
        throw new Error("No game ID has been provided!");
    }

    try {
        await runTransaction(firestore, transaction =>
            switchNextChooserTransaction(transaction, gameId, focus)
        )
    } catch (error) {
        console.error("There was an error switching to the next chooser:", error);
        throw error;
    }
}

export const switchNextChooserTransaction = async (
    transaction,
    gameId,
    focus = true
) => {
    const gameStatesRef = doc(GAMES_COLLECTION_REF, gameId, 'realtime', 'states')
    const gameStatesData = await getDocDataTransaction(transaction, gameStatesRef)
    const { chooserOrder, chooserIdx } = gameStatesData

    const newChooserIdx = getNextCyclicIndex(chooserIdx, chooserOrder.length)
    transaction.update(gameStatesRef, {
        chooserIdx: newChooserIdx
    })
    const newChooserTeamId = chooserOrder[newChooserIdx]
    console.log("New chooser team:", newChooserTeamId)

    if (!focus)
        return

    console.log("Updating player statuses...")
    const playersCollectionRef = collection(GAMES_COLLECTION_REF, gameId, 'players')
    const choosersSnapshot = await getDocs(query(playersCollectionRef, where('teamId', '==', newChooserTeamId)))
    for (const playerDoc of choosersSnapshot.docs) {
        transaction.update(playerDoc.ref, {
            status: 'focus'
        })
    }
}