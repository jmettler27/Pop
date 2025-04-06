"use server";

import { isRiddle } from '@/backend/utils/question_types';

import { firestore } from '@/backend/firebase/firebase'
import { GAMES_COLLECTION_REF, QUESTIONS_COLLECTION_REF, USERS_COLLECTION_REF } from '@/backend/firebase/firestore';
import {
    doc,
    arrayUnion,
    runTransaction,
    collection,
    serverTimestamp,
    arrayRemove,
} from 'firebase/firestore'

import { getDocDataTransaction } from '@/backend/services/utils';
import { resetGameChooserTransaction } from '@/backend/services/chooser/chooser';

import { ScorePolicyType } from '@/backend/models/ScorePolicy';
import { EnumerationQuestionStatus } from '@/backend/models/questions/Enumeration';
import { RoundType } from '@/backend/models/rounds/RoundType';
import { Round } from '@/backend/models/rounds/Round';
import { QuestionType } from '@/backend/models/questions/QuestionType';
import { GameStatus } from '@/backend/models/games/GameStatus';

/* ==================================================================================================== */
export async function addRoundToGame(gameId, title, type) {
    if (!gameId) {
        throw new Error("No game ID has been provided!");
    }

    try {
        await runTransaction(firestore, transaction =>
            addRoundToGameTransaction(transaction, gameId, title, type)
        )
        console.log(`Game ${gameId}: Round created successfully.`);
    } catch (error) {
        console.error("There was an error creating the round:", error);
        throw error;
    }
}

const addRoundToGameTransaction = async (
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

    if (roundScorePolicy === ScorePolicyType.RANKING) {
        initRoundInfo.rewards = Round.REWARDS;
    }

    if (type === RoundType.MIXED) {
        initRoundInfo.rewardsPerQuestion = 1;
        initRoundInfo.invalidateTeam = false;
        initRoundInfo.maxTries = 2;
        initRoundInfo.delay = 2;
        initRoundInfo.rewardsForBonus = 1;
        initRoundInfo.mistakePenalty = - 1;
        initRoundInfo.rewardsPerElement = 1;
    } else if (type === RoundType.PROGRESSIVE_CLUES) {
        initRoundInfo.rewardsPerQuestion = ProgressiveCluesRound.REWARD;
        initRoundInfo.invalidateTeam = false;
        initRoundInfo.maxTries = ProgressiveCluesRound.MAX_NUM_MISTAKES;
        initRoundInfo.delay = ProgressiveCluesRound.DEFAULT_DELAY;
    } else if (type === RoundType.IMAGE) {
        initRoundInfo.rewardsPerQuestion = ImageRound.REWARD;
        initRoundInfo.invalidateTeam = false;
        initRoundInfo.maxTries = ImageRound.MAX_NUM_MISTAKES;
    } else if (type === RoundType.BLINDTEST) {
        initRoundInfo.rewardsPerQuestion = BlindtestRound.REWARD;
        initRoundInfo.invalidateTeam = false;
        initRoundInfo.maxTries = BlindtestRound.MAX_NUM_MISTAKES;
    } else if (type === RoundType.EMOJI) {
        initRoundInfo.rewardsPerQuestion = EmojiRound.REWARD;
        initRoundInfo.invalidateTeam = false;
        initRoundInfo.maxTries = EmojiRound.MAX_NUM_MISTAKES;
    } else if (type === RoundType.QUOTE) {
        initRoundInfo.rewardsPerElement = QuoteRound.REWARDS_PER_ELEMENT;
        initRoundInfo.invalidateTeam = false;
        initRoundInfo.maxTries = QuoteRound.MAX_NUM_MISTAKES;
    } else if (type === RoundType.LABELLING) {
        initRoundInfo.rewardsPerElement = LabelRound.REWARDS_PER_ELEMENT;
        initRoundInfo.invalidateTeam = false;
        initRoundInfo.maxTries = LabelRound.MAX_NUM_MISTAKES;
    } else if (type === RoundType.ENUMERATION) {
        initRoundInfo.rewardsPerQuestion = EnumRound.REWARD;
        initRoundInfo.rewardsForBonus = EnumRound.DEFAULT_BONUS;
    } else if (type === RoundType.ODD_ONE_OUT) {
        initRoundInfo.mistakePenalty = roundScorePolicy === ScorePolicyType.COMPLETION_RATE ? -20 : OddOneOutRound.DEFAULT_MISTAKE_PENALTY;
    } else if (type === RoundType.MATCHING) {
        initRoundInfo.mistakePenalty = roundScorePolicy === ScorePolicyType.COMPLETION_RATE ? -5 : MatchingRound.DEFAULT_MISTAKE_PENALTY;
        initRoundInfo.maxMistakes = MatchingRound.MAX_NUM_MISTAKES;
    } else if (type === RoundType.MCQ) {
        initRoundInfo.rewardsPerQuestion = MCQRound.REWARD;
    } else if (type === RoundType.NAGUI) {
        initRoundInfo.rewardsPerQuestion = NaguiRound.REWARDS;
    } else if (type === RoundType.BASIC) {
        initRoundInfo.rewardsPerQuestion = BasicRound.REWARD;
    }

    // Create a new round document
    const roundsCollectionRef = collection(GAMES_COLLECTION_REF, gameId, 'rounds');
    const roundRef = doc(roundsCollectionRef);
    const roundId = roundRef.id;
    transaction.set(roundRef, initRoundInfo);
    console.log(`Game ${gameId}: Round ${roundId} created successfully.`);

    const roundScoresRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'realtime', 'scores');
    transaction.set(roundScoresRef, {
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
export async function addQuestionToRound(gameId, roundId, questionId, managerId) {
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
            addQuestionToRoundTransaction(transaction, gameId, roundId, questionId, managerId)
        )
        console.log(`Game ${gameId}, Round ${roundId}: Realtime info of ${questionId} added successfully.`);
    } catch (error) {
        console.error("There was an error adding the question:", error);
        throw error;
    }
}

const addQuestionToRoundTransaction = async (
    transaction,
    gameId,
    roundId,
    questionId,
    managerId
) => {
    const baseQuestionRef = doc(QUESTIONS_COLLECTION_REF, questionId);
    const baseQuestion = await getDocDataTransaction(transaction, baseQuestionRef);

    const gameQuestionRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId);
    const commonGameQuestion = {
        dateEnd: null,
        dateStart: null,
        managedBy: managerId,
    }

    if (isRiddle(baseQuestion.type)) {
        const initGameRiddleQuestion = {
            ...commonGameQuestion,
            winner: null,
        }
        if (baseQuestion.type === QuestionType.PROGRESSIVE_CLUES) {
            // Add the currentClueIdx :-1 
            initGameRiddleQuestion.currentClueIdx = -1;
        }
        transaction.set(gameQuestionRef, initGameRiddleQuestion);

        const gameQuestionPlayersRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId, 'realtime', 'players');
        transaction.set(gameQuestionPlayersRef, {
            buzzed: [],
            canceled: [],
        });

    } else if (baseQuestion.type === QuestionType.QUOTE) {
        transaction.set(gameQuestionRef, {
            ...commonGameQuestion,
        });

        const { toGuess } = baseQuestion.details
        const initialRevealed = toGuess.reduce((acc, elem) => {
            acc[elem] = {}
            return acc
        }, {})
        if (toGuess.includes('quote')) {
            const { quoteParts } = baseQuestion.details
            initialRevealed['quote'] = quoteParts.reduce((acc, _, idx) => {
                acc[idx] = {}
                return acc
            }, {})
        }
        transaction.update(gameQuestionRef, {
            revealed: initialRevealed
        })

        const gameQuestionPlayersRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId, 'realtime', 'players')
        transaction.set(gameQuestionPlayersRef, {
            buzzed: [],
            canceled: []
        })
    } else if (baseQuestion.type === QuestionType.LABELLING) {
        transaction.set(gameQuestionRef, {
            ...commonGameQuestion,
        });

        const { labels } = baseQuestion.details

        const initialRevealed = Array.from({ length: labels.length }, () => ({}));

        transaction.update(gameQuestionRef, {
            revealed: initialRevealed
        })

        const gameQuestionPlayersRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId, 'realtime', 'players')
        transaction.set(gameQuestionPlayersRef, {
            buzzed: [],
            canceled: []
        })

    } else if (baseQuestion.type === QuestionType.ENUMERATION) {
        transaction.set(gameQuestionRef, {
            ...commonGameQuestion,
            winner: null,
            status: EnumerationQuestionStatus.REFLECTION
        });

        const gameQuestionPlayersRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId, 'realtime', 'players');
        transaction.set(gameQuestionPlayersRef, {
            bets: [],
        });

    } else if (baseQuestion.type === QuestionType.ODD_ONE_OUT) {
        transaction.set(gameQuestionRef, {
            ...commonGameQuestion,
            winner: null,
            selectedItems: [],
        });
    } else if (baseQuestion.type === QuestionType.REORDERING) {
        transaction.set(gameQuestionRef, {
            ...commonGameQuestion,
            orderings: {},
        });
    } else if (baseQuestion.type === QuestionType.MATCHING) {
        transaction.set(gameQuestionRef, {
            ...commonGameQuestion,
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

        if (baseQuestion.numCols > 2) {
            const partiallyCorrectMatchesRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId, 'realtime', 'partially_correct');
            transaction.set(partiallyCorrectMatchesRef, {
                partiallyCorrectMatches: [],
            });
        }

    } else if (baseQuestion.type === QuestionType.MCQ) {
        transaction.set(gameQuestionRef, {
            ...commonGameQuestion,
            correct: null,
            playerId: null,
            reward: null,
            teamId: null,
        });

    } else if (baseQuestion.type === QuestionType.NAGUI) {
        transaction.set(gameQuestionRef, {
            ...commonGameQuestion,
            correct: null,
            option: null,
            playerId: null,
            reward: null,
            teamId: null,
        });
    } else if (baseQuestion.type === QuestionType.BASIC) {
        transaction.set(gameQuestionRef, {
            ...commonGameQuestion,
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

    if (isRiddle(type) || type === QuestionType.QUOTE) {
        const gameQuestionPlayersRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId, 'realtime', 'players');
        transaction.delete(gameQuestionPlayersRef);
    }

    if (type === QuestionType.MATCHING) {
        const correctMatchesRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId, 'realtime', 'correct');
        transaction.delete(correctMatchesRef);

        const incorrectMatchesRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId, 'realtime', 'incorrect');
        transaction.delete(incorrectMatchesRef);

        const partiallyCorrectMatchesRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId, 'realtime', 'partially_correct');
        transaction.delete(partiallyCorrectMatchesRef);
    }

    const gameQuestionRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId);
    transaction.delete(gameQuestionRef);

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
    const baseQuestionRef = doc(QUESTIONS_COLLECTION_REF, questionId);
    transaction.update(baseQuestionRef, {
        createdBy: userId
    });

    const gameQuestionRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId);
    transaction.update(gameQuestionRef, {
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
        status: GameStatus.GAME_START
    });
}