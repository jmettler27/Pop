"use server";

import { getDocDataTransaction } from '@/app/(game)/lib/utils';
import { db } from '@/lib/firebase/firebase'
import { GAMES_COLLECTION_REF, QUESTIONS_COLLECTION_REF, USERS_COLLECTION_REF } from '@/lib/firebase/firestore';
import { BLINDTEST_DEFAULT_REWARD } from '@/lib/utils/question/blindtest';
import { EMOJI_DEFAULT_REWARD } from '@/lib/utils/question/emoji';
import { ENUM_DEFAULT_BONUS, ENUM_DEFAULT_REWARD } from '@/lib/utils/question/enum';
import { IMAGE_DEFAULT_REWARD } from '@/lib/utils/question/image';
import { MATCHING_DEFAULT_MISTAKE_PENALTY } from '@/lib/utils/question/matching';
import { MCQ_DEFAULT_REWARDS } from '@/lib/utils/question/mcq';
import { OOO_DEFAULT_MISTAKE_PENALTY } from '@/lib/utils/question/odd_one_out';
import { PROGRESSIVE_CLUES_DEFAULT_DELAY, PROGRESSIVE_CLUES_DEFAULT_MAX_TRIES } from '@/lib/utils/question/progressive_clues';
import { isRiddle } from '@/lib/utils/question_types';
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
    increment,
    arrayRemove
} from 'firebase/firestore'


/* ==================================================================================================== */
export async function addGameRound(gameId, title, type, rewards, rewardsPerQuestion) {
    if (!gameId) {
        throw new Error("No game ID has been provided!");
    }

    try {
        await runTransaction(db, transaction =>
            addGameRoundTransaction(transaction, gameId, title, type, rewards, rewardsPerQuestion)
        )
        console.log(`Game ${gameId}: Round created successfully.`);
    } catch (error) {
        console.error("There was an error creating the round:", error);
        throw error;
    }
}

const addGameRoundTransaction = async (
    transaction,
    gameId,
    title,
    type,
    rewards,
    rewardsPerQuestion
) => {
    const initRoundInfo = {
        currentQuestionIdx: 0,
        dateEnd: null,
        dateStart: null,
        createdAt: serverTimestamp(),
        questions: [],
        rewards,
        title,
        type,
    }

    if (type === 'progressive_clues') {
        initRoundInfo.rewardsPerQuestion = 1
        initRoundInfo.invalidateTeam = false;
        initRoundInfo.delay = PROGRESSIVE_CLUES_DEFAULT_DELAY
        initRoundInfo.maxTries = PROGRESSIVE_CLUES_DEFAULT_MAX_TRIES
    } else if (type === 'image') {
        initRoundInfo.rewardsPerQuestion = IMAGE_DEFAULT_REWARD
    } else if (type === 'blindtest') {
        initRoundInfo.rewardsPerQuestion = BLINDTEST_DEFAULT_REWARD
    } else if (type === 'emoji') {
        initRoundInfo.rewardsPerQuestion = EMOJI_DEFAULT_REWARD
    } else if (type === 'enum') {
        initRoundInfo.rewardsPerQuestion = ENUM_DEFAULT_REWARD
        initRoundInfo.rewardsForBonus = ENUM_DEFAULT_BONUS;
    } else if (type === 'odd_one_out') {
        initRoundInfo.rewardsPerQuestion = OOO_DEFAULT_MISTAKE_PENALTY
    } else if (type === 'matching') {
        initRoundInfo.mistakePenalty = MATCHING_DEFAULT_MISTAKE_PENALTY
    } else if (type === 'mcq') {
        initRoundInfo.rewardsPerQuestion = MCQ_DEFAULT_REWARDS
    }

    // Create a new round document
    const roundsCollectionRef = collection(GAMES_COLLECTION_REF, gameId, 'rounds');
    const roundRef = doc(roundsCollectionRef);
    const roundId = roundRef.id;
    transaction.set(roundRef, initRoundInfo);
    console.log(`Game ${gameId}: Round ${roundId} created successfully.`);

    const roundRealtimeScoresRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'realtime', 'scores');
    transaction.set(roundRealtimeScoresRef, {
        gameSortedTeams: [],
        rankingDiffs: {},
        roundSortedTeams: [],
        scores: {},
        scoresProgress: {},
        teamScoresSequence: {}
    });
}


/* ==================================================================================================== */
export async function addGameQuestion(gameId, roundId, questionId, managerId) {
    if (!gameId) {
        throw new Error("No game ID has been provided!");
    }
    if (!roundId) {
        throw new Error("No round ID has been provided!");
    }
    if (!questionId) {
        throw new Error("No question ID has been provided!");
    }
    if (!managerId) {
        throw new Error("No manager ID has been provided!");
    }
    try {
        await runTransaction(db, transaction =>
            addGameQuestionTransaction(transaction, gameId, roundId, questionId, managerId)
        )
        console.log(`Game ${gameId}, Round ${roundId}: Realtime info of ${questionId} added successfully.`);
    } catch (error) {
        console.error("There was an error adding the question:", error);
        throw error;
    }
}

const addGameQuestionTransaction = async (
    transaction,
    gameId,
    roundId,
    questionId,
    managerId
) => {
    const questionRef = doc(QUESTIONS_COLLECTION_REF, questionId);
    const questionData = await getDocDataTransaction(transaction, questionRef);

    const questionRealtimeRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId);
    const commonRealtimeInfo = {
        dateEnd: null,
        dateStart: null,
        managedBy: managerId,
    }

    if (isRiddle(questionData.type)) {
        const initRiddleRealtimeInfo = {
            ...commonRealtimeInfo,
            winner: null,
        }
        if (questionData.type === 'progressive_clues') {
            // Add the currentClueIdx :-1 
            initRiddleRealtimeInfo.currentClueIdx = -1;
        }
        transaction.set(questionRealtimeRef, initRiddleRealtimeInfo);

        const questionRealtimePlayersRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId, 'realtime', 'players');
        transaction.set(questionRealtimePlayersRef, {
            buzzed: [],
            canceled: [],
        });

    } else if (questionData.type === 'enum') {
        transaction.set(questionRealtimeRef, {
            ...commonRealtimeInfo,
            winner: null,
            status: 'reflection_active'
        });

        const questionRealtimePlayersRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId, 'realtime', 'players');
        transaction.set(questionRealtimePlayersRef, {
            bets: [],
        });

    } else if (questionData.type === 'odd_one_out') {
        transaction.set(questionRealtimeRef, {
            ...commonRealtimeInfo,
            winner: null,
            selectedItems: [],
        });

    } else if (questionData.type === 'matching') {
        transaction.set(questionRealtimeRef, {
            ...commonRealtimeInfo,
        });

        // Create the document doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId, 'realtime', 'correct')
        const correctMatchesDocRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId, 'realtime', 'correct');
        transaction.set(correctMatchesDocRef, {
            correctMatches: [],
        });

        const incorrectMatchesDocRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId, 'realtime', 'incorrect');
        transaction.set(incorrectMatchesDocRef, {
            incorrectMatches: [],
        });

        if (questionData.numCols > 2) {
            const partiallyCorrectMatchesDocRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId, 'realtime', 'partially_correct');
            transaction.set(partiallyCorrectMatchesDocRef, {
                partiallyCorrectMatches: [],
            });
        }

    } else if (questionData.type === 'mcq') {
        transaction.set(questionRealtimeRef, {
            ...commonRealtimeInfo,
            correct: null,
            option: null,
            playerId: null,
            reward: null,
            teamId: null,
        });
    }

    const roundRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId);
    transaction.update(roundRef, {
        questions: arrayUnion(questionId)
    });
}

/* ==================================================================================================== */
export async function removeRoundFromGame(gameId, roundId) {
    if (!gameId) {
        throw new Error("No game ID has been provided!");
    }
    if (!roundId) {
        throw new Error("No round ID has been provided!");
    }
    try {
        await runTransaction(db, transaction =>
            removeRoundFromGameTransaction(transaction, gameId, roundId)
        )
        console.log(`Game ${gameId}: Realtime info of ${roundId} removed successfully.`);
    } catch (error) {
        console.error("There was an error removing the question:", error);
        throw error;
    }
}

const removeRoundFromGameTransaction = async (
    transaction,
    gameId,
    roundId,
) => {

    const roundRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId);
    transaction.delete(roundRef);
}


/* ==================================================================================================== */
export async function removeQuestionFromRound(gameId, roundId, questionId) {
    if (!gameId) {
        throw new Error("No game ID has been provided!");
    }
    if (!roundId) {
        throw new Error("No round ID has been provided!");
    }
    if (!questionId) {
        throw new Error("No question ID has been provided!");
    }
    try {
        await runTransaction(db, transaction =>
            removeQuestionFromRoundTransaction(transaction, gameId, roundId, questionId)
        )
        console.log(`Game ${gameId}, Round ${roundId}: Realtime info of ${questionId} removed successfully.`);
    } catch (error) {
        console.error("There was an error removing the question:", error);
        throw error;
    }
}

const removeQuestionFromRoundTransaction = async (
    transaction,
    gameId,
    roundId,
    questionId,
) => {

    const roundRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId);
    transaction.update(roundRef, {
        questions: arrayRemove(questionId)
    });

    const questionRealtimeRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId);
    transaction.delete(questionRealtimeRef);
}

/* ==================================================================================================== */
export async function addGameOrganizer(gameId, organizerId) {
    if (!gameId) {
        throw new Error("No game ID has been provided!");
    }
    if (!organizerId) {
        throw new Error("No organizer ID has been provided!");
    }
    try {
        await runTransaction(db, transaction =>
            addGameOrganizerTransaction(transaction, gameId, organizerId)
        )
        console.log(`Game ${gameId}: Organizer ${organizerId} added successfully.`);
    } catch (error) {
        console.error("There was an error adding the organizer:", error);
        throw error;
    }
}

const addGameOrganizerTransaction = async (
    transaction,
    gameId,
    organizerId,
) => {
    const userRef = doc(USERS_COLLECTION_REF, organizerId);
    const userData = await getDocDataTransaction(transaction, userRef);

    const { image, name } = userData;

    // Create the document doc(GAMES_COLLECTION_REF, gameId, 'organizers', organizerId)
    const organizerRef = doc(GAMES_COLLECTION_REF, gameId, 'organizers', organizerId);
    transaction.set(organizerRef, {
        image,
        name,
    });
}

/* ==================================================================================================== */
export async function launchGame(gameId) {
    if (!gameId) {
        throw new Error("No game ID has been provided!");
    }
    try {
        await runTransaction(db, transaction =>
            launchGameTransaction(transaction, gameId)
        )
        console.log(`Game ${gameId}: Launched successfully.`);
    } catch (error) {
        console.error("There was an error launching the game:", error);
        throw error;
    }
}

const launchGameTransaction = async (
    transaction,
    gameId,
) => {
    const gameDocRef = doc(GAMES_COLLECTION_REF, gameId);
    transaction.update(gameDocRef, {
        dateStart: serverTimestamp(),
        status: 'game_start'
    });
}