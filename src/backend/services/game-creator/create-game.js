"use server";

import { addSoundTransaction } from '@/backend/services/sound/sounds';
import { getDocDataTransaction } from '@/backend/services/utils';
import { Timer } from '@/backend/models/Timer';

import { firestore } from '@/backend/firebase/firebase';
import { GAMES_COLLECTION_REF, USERS_COLLECTION_REF } from '@/backend/firebase/firestore'
import {
    doc,
    runTransaction,
    serverTimestamp,
} from 'firebase/firestore'

import { TimerStatus } from '@/backend/models/Timer';

/* ==================================================================================================== */
export async function createGame(title, type, lang, maxPlayers, roundScorePolicy, organizerName, organizerId) {
    try {
        const gameId = await runTransaction(firestore, transaction =>
            createGameTransaction(transaction, title, type, lang, maxPlayers, roundScorePolicy, organizerName, organizerId)
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
    roundScorePolicy,
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
        roundScorePolicy,
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

    await addSoundTransaction(transaction, gameId, "level-passed");

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

    const chooserRef = doc(GAMES_COLLECTION_REF, gameId, 'realtime', 'states');
    transaction.set(chooserRef, {
        chooserIdx: null,
        chooserOrder: null,
    })

    const timerRef = doc(GAMES_COLLECTION_REF, gameId, 'realtime', 'timer');
    transaction.set(timerRef, {
        authorized: false,
        duration: Timer.READY_COUNTDOWN_SECONDS,
        forward: false,
        managedBy: organizerId,
        status: TimerStatus.RESET,
        timestamp: serverTimestamp()
    })

    console.log("Realtime collections created successfully.")
}

