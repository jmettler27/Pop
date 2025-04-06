"use server";

import { GAMES_COLLECTION_REF, QUESTIONS_COLLECTION_REF } from '@/backend/firebase/firestore';
import { firestore } from '@/backend/firebase/firebase'
import { doc, runTransaction, serverTimestamp, updateDoc } from 'firebase/firestore'

import { getDocData, getDocDataTransaction, updateGameStatusTransaction } from '@/backend/services/utils';
import { resetGameProgressiveCluesTransaction } from '@/backend/services/question/progressive-clues/actions_old';
import { handleRiddleCountdownEndTransaction, resetRiddleQuestionTransaction } from '@/backend/services/question/riddle/actions_old';
import { endEnumQuestionTransaction, endEnumReflectionTransaction, resetEnumQuestionTransaction } from '@/backend/services/question/enumeration/actions_old';
import { handleOOOCountdownEndTransaction, resetOddOneOutQuestionTransaction } from '@/backend/services/question/odd-one-out/actions_old';
import { handleMCQCountdownEndTransaction, resetMCQTransaction } from '@/backend/services/question/mcq/actions_old';
import { handleNaguiCountdownEndTransaction, resetNaguiTransaction } from '@/backend/services/question/nagui/actions_old';
import { handleMatchingCountdownEndTransaction, resetMatchingQuestionTransaction } from '@/backend/services/question/matching/actions_old';
import { handleQuoteCountdownEndTransaction, resetQuoteQuestionTransaction } from '@/backend/services/question/quote/actions_old';
import { resetLabelQuestionTransaction } from '@/backend/services/question/labelling/actions_old';

import { Timer } from '@/backend/models/Timer';
import { DEFAULT_THINKING_TIME_SECONDS } from '@/backend/utils/question/question';
import { isRiddle } from '@/backend/utils/question_types';
import { updateTimerTransaction } from '@/backend/services/timer/timer';
import { handleBasicQuestionCountdownEndTransaction, resetBasicQuestionTransaction } from '@/backend/services/question/basic/actions_old';

import { QuestionType } from '@/backend/models/questions/QuestionType';
import { TimerStatus } from '@/backend/models/Timer';
import { EnumerationQuestionStatus } from '@/backend/models/questions/Enumeration';

/* ==================================================================================================== */
// READ
export async function getQuestionData(questionId) {
    return getDocData('questions', questionId);
}

// REFACTOR: (questionPath, fieldsToUpdate)
// WRITE
export async function updateQuestionFields(gameId, roundId, questionId, fieldsToUpdate) {
    const gameQuestionRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId)
    const updateObject = { ...fieldsToUpdate }

    await updateDoc(gameQuestionRef, updateObject)
    console.log(`Game ${gameId}, Round ${roundId}, Question ${questionId}:`, fieldsToUpdate)
}


// WRITE
export async function updateQuestionWinner(gameId, roundId, questionId, playerId, teamId) {
    await updateQuestionFields(gameId, roundId, questionId, {
        winner: {
            playerId: playerId,
            teamId: teamId
        }
    })
}

/* ==================================================================================================== */

// Reset question
// REFACTOR: (questionPath, questionType)
export async function resetQuestion(gameId, roundId, questionId, questionType = null, alone = false) {
    if (!gameId) {
        throw new Error("No game ID has been provided!");
    }
    if (!roundId) {
        throw new Error("No round ID has been provided!");
    }
    if (!questionId) {
        throw new Error("No question ID has been provided!");
    }
    if (questionType && !QuestionType.includes(questionType)) {
        throw new Error(`Invalid question type provided: ${questionType}`);
    }

    try {
        await runTransaction(firestore, transaction =>
            resetQuestionTransaction(transaction, gameId, roundId, questionId, questionType, alone)
        )
        console.log("Question successfully reset.");
    }
    catch (error) {
        console.error("There was an error resetting the question:", error);
        throw error;
    }
}

export const resetQuestionTransaction = async (
    transaction,
    gameId,
    roundId,
    questionId,
    questionType = null,
    alone = false
) => {
    const type = questionType || (await getDocDataTransaction(transaction, doc(QUESTIONS_COLLECTION_REF, questionId))).type
    console.log(`Resetting question ${questionId} of type ${type}...`)

    switch (type) {
        case QuestionType.PROGRESSIVE_CLUES:
            await resetGameProgressiveCluesTransaction(transaction, gameId, roundId, questionId)
        case QuestionType.IMAGE:
        case QuestionType.BLINDTEST:
        case QuestionType.EMOJI:
            await resetRiddleQuestionTransaction(transaction, gameId, roundId, questionId)
            break
        case QuestionType.QUOTE:
            await resetQuoteQuestionTransaction(transaction, gameId, roundId, questionId)
            break
        case QuestionType.LABELLING:
            await resetLabelQuestionTransaction(transaction, gameId, roundId, questionId)
            break
        case QuestionType.ENUMERATION:
            await resetEnumQuestionTransaction(transaction, gameId, roundId, questionId)
            break
        case QuestionType.ODD_ONE_OUT:
            await resetOddOneOutQuestionTransaction(transaction, gameId, roundId, questionId)
            break
        case QuestionType.MATCHING:
            await resetMatchingQuestionTransaction(transaction, gameId, roundId, questionId)
            break
        case QuestionType.MCQ:
            await resetMCQTransaction(transaction, gameId, roundId, questionId)
            break
        case QuestionType.NAGUI:
            await resetNaguiTransaction(transaction, gameId, roundId, questionId)
            break
        case QuestionType.BASIC:
            await resetBasicQuestionTransaction(transaction, gameId, roundId, questionId)
            break
    }

    const gameQuestionRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId)
    transaction.update(gameQuestionRef, {
        dateStart: null,
        dateEnd: null,
    })

    if (alone) {
        await updateTimerTransaction(transaction, gameId, {
            status: TimerStatus.RESET,
            duration: DEFAULT_THINKING_TIME_SECONDS[type],
            forward: false
        })
    }
}

/* ==================================================================================================== */
// End question
export async function endQuestion(gameId, roundId, questionId) {
    try {
        const service = new GameQuestionService(gameId, roundId);
        await service.end(questionId);
    } catch (error) {
        console.error("There was an error ending the question:", error);
        throw error;
    }
}


/* ==================================================================================================== */
// export async function handleQuestionActiveCountdownEnd(gameId, roundId, questionId, questionType = null) {
//     if (!gameId) {
//         throw new Error("No game ID has been provided!");
//     }
//     if (!roundId) {
//         throw new Error("No round ID has been provided!");
//     }
//     if (!questionId) {
//         throw new Error("No question ID has been provided!");
//     }

//     try {
//         await runTransaction(firestore, transaction =>
//             handleQuestionActiveCountdownEndTransaction(transaction, gameId, roundId, questionId, questionType)
//         )
//         console.log("Question active countdown end successfully handled.");
//     } catch (error) {
//         console.error("There was an error handling the question active countdown end:", error);
//         throw error;
//     }
// }

// const handleQuestionActiveCountdownEndTransaction = async (
//     transaction,
//     gameId,
//     roundId,
//     questionId,
//     questionType = null
// ) => {

//     const type = questionType || (await getDocDataTransaction(transaction, doc(QUESTIONS_COLLECTION_REF, questionId))).type

//     console.log(`Handling question active countdown end for question ${questionId} of type ${type}...`)

//     if (isRiddle(type)) {
//         await handleRiddleCountdownEndTransaction(transaction, gameId, roundId, questionId, type)
//     } else if (type === QuestionType.QUOTE) {
//         await handleQuoteCountdownEndTransaction(transaction, gameId, roundId, questionId)
//     } else if (type === QuestionType.ODD_ONE_OUT) {
//         await handleOOOCountdownEndTransaction(transaction, gameId, roundId, questionId)
//     } else if (type === QuestionType.MATCHING) {
//         await handleMatchingCountdownEndTransaction(transaction, gameId, roundId, questionId)
//     } else if (type === QuestionType.MCQ) {
//         await handleMCQCountdownEndTransaction(transaction, gameId, roundId, questionId)
//     } else if (type === QuestionType.NAGUI) {
//         await handleNaguiCountdownEndTransaction(transaction, gameId, roundId, questionId)
//     } else if (type === QuestionType.BASIC) {
//         await handleBasicQuestionCountdownEndTransaction(transaction, gameId, roundId, questionId)
//     } else if (type === QuestionType.ENUMERATION) {
//         const gameQuestionRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId)
//         const gameQuestionData = await getDocDataTransaction(transaction, gameQuestionRef)
//         const { status } = gameQuestionData
//         if (status === EnumerationQuestionStatus.REFLECTION) {
//             await endEnumReflectionTransaction(transaction, gameId, roundId, questionId)
//         } else if (status === EnumerationQuestionStatus.CHALLENGE) {
//             await endEnumQuestionTransaction(transaction, gameId, roundId, questionId)
//         }
//     }
//     // await updateTimerStateTransaction(transaction, gameId, TimerStatus.RESET)
// }
