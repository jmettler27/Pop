"use server";

import { BLINDTEST_DEFAULT_REWARD, BLINDTEST_DEFAULT_MAX_TRIES } from '@/lib/utils/question/blindtest';
import { EMOJI_DEFAULT_REWARD, EMOJI_DEFAULT_MAX_TRIES } from '@/lib/utils/question/emoji';
import { ENUM_DEFAULT_BONUS, ENUM_DEFAULT_REWARD } from '@/lib/utils/question/enum';
import { IMAGE_DEFAULT_MAX_TRIES, IMAGE_DEFAULT_REWARD } from '@/lib/utils/question/image';
import { MATCHING_DEFAULT_MISTAKE_PENALTY, MATCHING_MAX_NUM_MISTAKES } from '@/lib/utils/question/matching';
import { MCQ_DEFAULT_REWARD } from '@/lib/utils/question/mcq';
import { NAGUI_DEFAULT_REWARDS } from '@/lib/utils/question/nagui';
import { OOO_DEFAULT_MISTAKE_PENALTY } from '@/lib/utils/question/odd_one_out';
import { PROGRESSIVE_CLUES_DEFAULT_DELAY, PROGRESSIVE_CLUES_DEFAULT_MAX_TRIES, PROGRESSIVE_CLUES_DEFAULT_REWARD } from '@/lib/utils/question/progressive_clues';
import { isRiddle } from '@/lib/utils/question_types';

import { firestore } from '@/lib/firebase/firebase'
import { GAMES_COLLECTION_REF, QUESTIONS_COLLECTION_REF, USERS_COLLECTION_REF } from '@/lib/firebase/firestore';
import {
    doc,
    arrayUnion,
    runTransaction,
    collection,
    serverTimestamp,
    arrayRemove,
} from 'firebase/firestore'

import { getDocDataTransaction } from '@/app/(game)/lib/utils';
import { QUOTE_DEFAULT_MAX_TRIES, QUOTE_DEFAULT_REWARDS_PER_ELEMENT } from '@/lib/utils/question/quote';
import { resetGameChooserTransaction } from '@/app/(game)/lib/chooser';
import { BASIC_QUESTION_DEFAULT_REWARD } from '@/lib/utils/question/basic';
import { GAME_ROUND_DEFAULT_REWARDS } from '@/lib/utils/round';

/* ==================================================================================================== */
export async function addGameRound(gameId, title, type, rewards, rewardsPerQuestion) {
    if (!gameId) {
        throw new Error("No game ID has been provided!");
    }

    try {
        await runTransaction(firestore, transaction =>
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
) => {
    const gameRef = doc(GAMES_COLLECTION_REF, gameId);
    const gameData = await getDocDataTransaction(transaction, gameRef);

    const initRoundInfo = {
        currentQuestionIdx: 0,
        dateEnd: null,
        dateStart: null,
        order: null,
        createdAt: serverTimestamp(),
        questions: [],
        title,
        type,
    }
    const { roundScorePolicy } = gameData;

    if (roundScorePolicy === 'ranking') {
        initRoundInfo.rewards = GAME_ROUND_DEFAULT_REWARDS;
    }

    if (type === 'mixed') {
        initRoundInfo.rewardsPerQuestion = 1;
        initRoundInfo.invalidateTeam = false;
        initRoundInfo.maxTries = 2;
        initRoundInfo.delay = 2;
        initRoundInfo.rewardsForBonus = 1;
        initRoundInfo.mistakePenalty = - 1;
        initRoundInfo.rewardsPerElement = 1;
    } else if (type === 'progressive_clues') {
        initRoundInfo.rewardsPerQuestion = PROGRESSIVE_CLUES_DEFAULT_REWARD;
        initRoundInfo.invalidateTeam = false;
        initRoundInfo.maxTries = PROGRESSIVE_CLUES_DEFAULT_MAX_TRIES;
        initRoundInfo.delay = PROGRESSIVE_CLUES_DEFAULT_DELAY;
    } else if (type === 'image') {
        initRoundInfo.rewardsPerQuestion = IMAGE_DEFAULT_REWARD;
        initRoundInfo.invalidateTeam = false;
        initRoundInfo.maxTries = IMAGE_DEFAULT_MAX_TRIES;
    } else if (type === 'blindtest') {
        initRoundInfo.rewardsPerQuestion = BLINDTEST_DEFAULT_REWARD;
        initRoundInfo.invalidateTeam = false;
        initRoundInfo.maxTries = BLINDTEST_DEFAULT_MAX_TRIES;
    } else if (type === 'emoji') {
        initRoundInfo.rewardsPerQuestion = EMOJI_DEFAULT_REWARD;
        initRoundInfo.invalidateTeam = false;
        initRoundInfo.maxTries = EMOJI_DEFAULT_MAX_TRIES;
    } else if (type === 'quote') {
        initRoundInfo.rewardsPerElement = QUOTE_DEFAULT_REWARDS_PER_ELEMENT;
        initRoundInfo.invalidateTeam = false;
        initRoundInfo.maxTries = QUOTE_DEFAULT_MAX_TRIES;
    } else if (type === 'enum') {
        initRoundInfo.rewardsPerQuestion = ENUM_DEFAULT_REWARD;
        initRoundInfo.rewardsForBonus = ENUM_DEFAULT_BONUS;
    } else if (type === 'odd_one_out') {
        initRoundInfo.mistakePenalty = roundScorePolicy === 'completion_rate' ? -20 : OOO_DEFAULT_MISTAKE_PENALTY;
    } else if (type === 'matching') {
        initRoundInfo.mistakePenalty = roundScorePolicy === 'completion_rate' ? -5 : MATCHING_DEFAULT_MISTAKE_PENALTY;
        initRoundInfo.maxMistakes = MATCHING_MAX_NUM_MISTAKES;
    } else if (type === 'mcq') {
        initRoundInfo.rewardsPerQuestion = MCQ_DEFAULT_REWARD;
    } else if (type === 'nagui') {
        initRoundInfo.rewardsPerQuestion = NAGUI_DEFAULT_REWARDS;
    } else if (type === 'basic') {
        initRoundInfo.rewardsPerQuestion = BASIC_QUESTION_DEFAULT_REWARD;
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
    });

    transaction.update(gameRef, {
        rounds: arrayUnion(roundId)
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
        await runTransaction(firestore, transaction =>
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

    } else if (questionData.type === 'quote') {
        transaction.set(questionRealtimeRef, {
            ...commonRealtimeInfo,
        });

        const { toGuess } = questionData.details
        const initialRevealed = toGuess.reduce((acc, elem) => {
            acc[elem] = {}
            return acc
        }, {})
        if (toGuess.includes('quote')) {
            const { quoteParts } = questionData.details
            initialRevealed['quote'] = quoteParts.reduce((acc, _, idx) => {
                acc[idx] = {}
                return acc
            }, {})
        }
        transaction.update(questionRealtimeRef, {
            revealed: initialRevealed
        })

        const questionRealtimePlayersRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId, 'realtime', 'players')
        transaction.set(questionRealtimePlayersRef, {
            buzzed: [],
            canceled: []
        })
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
            teamNumMistakes: {},
            canceled: [],
        });

        // Create the document doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId, 'realtime', 'correct')
        const correctMatchesRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId, 'realtime', 'correct');
        transaction.set(correctMatchesRef, {
            correctMatches: [],
        });

        const incorrectMatchesRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId, 'realtime', 'incorrect');
        transaction.set(incorrectMatchesRef, {
            incorrectMatches: [],
        });

        if (questionData.numCols > 2) {
            const partiallyCorrectMatchesRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId, 'realtime', 'partially_correct');
            transaction.set(partiallyCorrectMatchesRef, {
                partiallyCorrectMatches: [],
            });
        }

    } else if (questionData.type === 'mcq') {
        transaction.set(questionRealtimeRef, {
            ...commonRealtimeInfo,
            correct: null,
            playerId: null,
            reward: null,
            teamId: null,
        });

    } else if (questionData.type === 'nagui') {
        transaction.set(questionRealtimeRef, {
            ...commonRealtimeInfo,
            correct: null,
            option: null,
            playerId: null,
            reward: null,
            teamId: null,
        });
    } else if (questionData.type === 'basic') {
        transaction.set(questionRealtimeRef, {
            ...commonRealtimeInfo,
            winner: null
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
        await runTransaction(firestore, transaction =>
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

    const gameRef = doc(GAMES_COLLECTION_REF, gameId);
    transaction.update(gameRef, {
        rounds: arrayRemove(roundId)
    });
}


/* ==================================================================================================== */
export async function removeQuestionFromRound(gameId, roundId, questionId, questionType = null) {
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
        await runTransaction(firestore, transaction =>
            removeQuestionFromRoundTransaction(transaction, gameId, roundId, questionId, questionType)
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
    questionType = null
) => {
    const type = questionType || (await getDocDataTransaction(transaction, doc(QUESTIONS_COLLECTION_REF, questionId))).type;

    if (isRiddle(type) || type === 'quote') {
        const questionRealtimePlayersRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId, 'realtime', 'players');
        transaction.delete(questionRealtimePlayersRef);
    }

    if (type === 'matching') {
        const correctMatchesRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId, 'realtime', 'correct');
        transaction.delete(correctMatchesRef);

        const incorrectMatchesRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId, 'realtime', 'incorrect');
        transaction.delete(incorrectMatchesRef);

        const partiallyCorrectMatchesRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId, 'realtime', 'partially_correct');
        transaction.delete(partiallyCorrectMatchesRef);
    }

    const questionRealtimeRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId);
    transaction.delete(questionRealtimeRef);

    const roundRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId);
    transaction.update(roundRef, {
        questions: arrayRemove(questionId)
    });
}

/* ==================================================================================================== */
export async function updateQuestionCreator(gameId, roundId, questionId, userId) {
    if (!gameId) {
        throw new Error("No game ID has been provided!");
    }
    if (!roundId) {
        throw new Error("No round ID has been provided!");
    }
    if (!questionId) {
        throw new Error("No question ID has been provided!");
    }
    if (!userId) {
        throw new Error("No user ID has been provided!");
    }
    try {
        await runTransaction(firestore, transaction =>
            updateQuestionCreatorTransaction(transaction, gameId, roundId, questionId, userId)
        )
        console.log(`Game ${gameId}, Round ${roundId}: Realtime info of ${questionId} removed successfully.`);
    } catch (error) {
        console.error("There was an error removing the question:", error);
        throw error;
    }
}

const updateQuestionCreatorTransaction = async (
    transaction,
    gameId,
    roundId,
    questionId,
    userId
) => {
    const questionRef = doc(QUESTIONS_COLLECTION_REF, questionId);
    transaction.update(questionRef, {
        createdBy: userId
    });

    const questionRealtimeRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId);
    transaction.update(questionRealtimeRef, {
        managedBy: userId
    });

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
        await runTransaction(firestore, transaction =>
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
        await runTransaction(firestore, transaction =>
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

    await resetGameChooserTransaction(transaction, gameId);

    const gameRef = doc(GAMES_COLLECTION_REF, gameId);
    transaction.update(gameRef, {
        launchedAt: serverTimestamp(),
        status: 'game_start'
    });
}