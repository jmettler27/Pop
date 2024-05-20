"use server";

import { addSoundToQueueTransaction } from '@/app/(game)/lib/sounds';
import { updateTimerTransaction } from '@/app/(game)/lib/timer';
import { getDocDataTransaction } from '@/app/(game)/lib/utils';
import { firestore } from '@/lib/firebase/firebase';
import { GAMES_COLLECTION_REF, USERS_COLLECTION_REF } from '@/lib/firebase/firestore'
import { READY_COUNTDOWN_SECONDS } from '@/lib/utils/time';
import {
    doc,
    arrayUnion,
    Timestamp,
    writeBatch,
    runTransaction,
    collection,
    serverTimestamp,
    where,
    query,
    getDocs,
    increment
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
    await createGameRealtimeTransaction(transaction, gameId);

    await addSoundToQueueTransaction(transaction, gameId, "level-passed");

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
    gameId
) => {
    const realtimeScoresRef = doc(GAMES_COLLECTION_REF, gameId, 'realtime', 'scores');
    transaction.set(realtimeScoresRef, {
        gameSortedTeams: [],
        scores: {},
        scoresProgress: {},

    });

    const realtimeStatesRef = doc(GAMES_COLLECTION_REF, gameId, 'realtime', 'states');
    transaction.set(realtimeStatesRef, {
        chooserIdx: null,
        chooserOrder: null,
    })

    await updateTimerTransaction(transaction, gameId, {
        duration: READY_COUNTDOWN_SECONDS,
        forward: false,
        status: 'resetted'

    });

    console.log("Realtime collections created successfully.")
}


// const createGameTeamsTransaction = async (
//     transaction,
//     gameId
// ) => {
//     const dummyTeamDocRef = doc(GAMES_COLLECTION_REF, gameId, 'teams', 'dummy');
//     transaction.set(dummyTeamDocRef, {
//         color: '#000000',
//         name: "Dummy Team",
//         teamAllowed: false
//     });

//     const dummyPlayerDocRef = doc(GAMES_COLLECTION_REF, gameId, 'players', 'dummy');
//     transaction.set(dummyPlayerDocRef, {
//         image: '',
//         joinedAt: serverTimestamp(),
//         name: "Dummy Player",
//         status: 'idle',
//         teamId: dummyTeamDocRef.id
//     });
// }


