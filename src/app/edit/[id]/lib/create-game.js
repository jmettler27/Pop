"use server";

import { addSoundEffectTransaction } from '@/app/(game)/lib/sounds';
import { getDocDataTransaction } from '@/app/(game)/lib/utils';
import { READY_COUNTDOWN_SECONDS } from '@/lib/utils/time';

import { firestore } from '@/lib/firebase/firebase';
import { GAMES_COLLECTION_REF, USERS_COLLECTION_REF } from '@/lib/firebase/firestore'
import {
    doc,
    runTransaction,
    serverTimestamp,
} from 'firebase/firestore'


/* ==================================================================================================== */
export async function createGame(title, type, lang, maxPlayers, organizerName, organizerId) {
    try {
        const gameId = await runTransaction(firestore, transaction =>
            createGameTransaction(transaction, title, type, lang, maxPlayers, organizerName, organizerId)
        )
        console.log(`Game ${gameId} created successfully.`)
        return gameId;
    } catch (error) {
        console.error("There was an error creating the game: ", error)
        throw error;
    }
}

export const createGameTransaction = async (
    transaction,
    title,
    type,
    lang,
    maxPlayers,
    organizerName,
    organizerId,
) => {
    const userRef = doc(USERS_COLLECTION_REF, organizerId);
    const userData = await getDocDataTransaction(transaction, userRef);

    // Create a new game document, and get its id
    const gameRef = doc(GAMES_COLLECTION_REF);
    transaction.set(gameRef, {
        currentQuestion: null,
        currentRound: null,
        dateEnd: null,
        dateStart: null,
        lang,
        maxPlayers,
        status: 'build',
        title,
        type,
        rounds: [],
    });
    const gameId = gameRef.id;

    // Create organizers collection
    await createGameOrganizersTransaction(transaction, gameId, organizerId, organizerName, userData.image);

    // Create realtime collection
    await createGameRealtimeTransaction(transaction, gameId, organizerId);

    await addSoundEffectTransaction(transaction, gameId, "level-passed");

    return gameId;
}


const createGameOrganizersTransaction = async (
    transaction,
    gameId,
    organizerId,
    organizerName,
    organizerImage
) => {
    const organizerRef = doc(GAMES_COLLECTION_REF, gameId, 'organizers', organizerId);
    transaction.set(organizerRef, {
        name: organizerName,
        image: organizerImage
    })
    console.log("Organizers collection created successfully.")
}

const createGameRealtimeTransaction = async (
    transaction,
    gameId,
    organizerId
) => {
    const readyRef = doc(GAMES_COLLECTION_REF, gameId, 'realtime', 'ready');
    transaction.set(readyRef, {
        numPlayers: 0,
        numReady: 0,
    });

    const scoresRef = doc(GAMES_COLLECTION_REF, gameId, 'realtime', 'scores');
    transaction.set(scoresRef, {
        gameSortedTeams: [],
        scores: {},
        scoresProgress: {},

    });

    const gameStatesRef = doc(GAMES_COLLECTION_REF, gameId, 'realtime', 'states');
    transaction.set(gameStatesRef, {
        chooserIdx: null,
        chooserOrder: null,
    })

    const timerRef = doc(GAMES_COLLECTION_REF, gameId, 'realtime', 'timer');
    transaction.set(timerRef, {
        authorized: false,
        duration: READY_COUNTDOWN_SECONDS,
        forward: false,
        managedBy: organizerId,
        status: 'reset',
        timestamp: serverTimestamp()
    })

    console.log("Realtime collections created successfully.")
}

