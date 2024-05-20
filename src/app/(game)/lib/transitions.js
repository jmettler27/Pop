"use server";

import { firestore } from '@/lib/firebase/firebase'
import {
    collection,
    query,
    where,
    getDocs,
    doc,
    serverTimestamp,
    runTransaction,
} from 'firebase/firestore'
import { GAMES_COLLECTION_REF } from '@/lib/firebase/firestore';

import { updateGameFields, switchAuthorizePlayersTransaction } from '@/app/(game)/lib/game';
import { getDocDataTransaction, updateGameStatusTransaction } from '@/app/(game)/lib/utils';
import { addSoundToQueueTransaction } from '@/app/(game)/lib/sounds';
import { updateTimerStateTransaction, updateTimerTransaction } from '@/app/(game)/lib/timer';


import { shuffle } from '@/lib/utils/arrays';
import { READY_COUNTDOWN_SECONDS } from '@/lib/utils/time';
import { updatePlayerStatusTransaction } from './players';

export async function setPlayerReady(gameId, playerId) {
    if (!gameId) {
        throw new Error("No game ID has been provided!");
    }
    if (!playerId) {
        throw new Error("No player ID has been provided!");
    }

    try {
        await runTransaction(firestore, transaction =>
            setPlayerReadyTransaction(transaction, gameId, playerId)
        )
    } catch (error) {
        console.error("There was an error setting the player status to ready:", error);
        throw error;
    }
}

const setPlayerReadyTransaction = async (
    transaction,
    gameId,
    playerId
) => {
    const readyDocRef = doc(GAMES_COLLECTION_REF, gameId, 'realtime', 'ready')
    const readyData = await getDocDataTransaction(transaction, readyDocRef)
    const { numReady, numPlayers } = readyData
    const newNumReady = numReady + 1

    await updatePlayerStatusTransaction(transaction, gameId, playerId, 'ready')

    transaction.update(readyDocRef, {
        numReady: newNumReady
    })

    const num = Math.floor(Math.random() * 50)
    await addSoundToQueueTransaction(transaction, gameId, num === 0 ? 'fart_perfecter' : 'pop')

    if (newNumReady === numPlayers) {
        await updateTimerTransaction(transaction, gameId, {
            status: 'started',
            duration: READY_COUNTDOWN_SECONDS,
            forward: false
        })
        await switchAuthorizePlayersTransaction(transaction, gameId, false)
    }
}


/* ==================================================================================================== */

// game_start -> game_home
export async function startGame(gameId) {
    if (!gameId) {
        throw new Error("No game ID has been provided!");
    }

    try {
        await runTransaction(firestore, transaction =>
            startGameTransaction(transaction, gameId)
        );
        console.log("Succesfully switched to game_home.");
    } catch (error) {
        console.error("There was an error starting the game:", error);
        throw error;
    }
}

export const startGameTransaction = async (
    transaction,
    gameId,
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
    const otherPlayersQuerySnapshot = await getDocs(query(playersCollectionRef, where('teamId', '!=', chooserTeamId)))

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

    for (const playerDoc of otherPlayersQuerySnapshot.docs) {
        transaction.update(playerDoc.ref, {
            status: 'idle'
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

    await updateTimerStateTransaction(transaction, gameId, 'resetted')
}

/* ==================================================================================================== */
// round_end -> game_home
export async function roundEndToGameHome(gameId) {
    if (!gameId) {
        throw new Error("No game ID has been provided!");
    }

    try {
        await runTransaction(firestore, transaction =>
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
    await addSoundToQueueTransaction(transaction, gameId, 'ui-confirmation-alert-b2')

    await updateGameStatusTransaction(transaction, gameId, 'game_home')
}

/* ==================================================================================================== */
export async function endGame(gameId) {
    await updateGameFields(gameId, {
        status: 'game_end'
    })
}
