"use server";

import { GAMES_COLLECTION_REF, QUESTIONS_COLLECTION_REF } from '@/lib/firebase/firestore';
import { firestore } from '@/lib/firebase/firebase'
import {
    collection,
    query,
    where,
    getDocs,
    doc,
    updateDoc,
    increment,
    serverTimestamp,
    runTransaction,
    setDoc,
} from 'firebase/firestore'

import { getDocData, getDocDataTransaction } from '@/app/(game)/lib/utils';
import { resetRoundInfo, updateRoundFields } from '@/app/(game)/lib/round';
import { initRoundScores } from '@/app/(game)/lib/scores';
import { addSoundEffectTransaction } from '@/app/(game)/lib/sounds';

import { getNextCyclicIndex } from '@/lib/utils/arrays';

// WRITE
async function updateFinaleThemeRealtime(gameId, roundId, themeId, fieldsToUpdate) {
    const themeRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'themes', themeId)
    const updateObject = { ...fieldsToUpdate }

    await updateDoc(themeRef, updateObject)
    console.log(`Game ${gameId}, Round ${roundId}, Theme ${themeId}:`, fieldsToUpdate)
}

// WRITE
async function updateFinaleThemeRealtimeSection(gameId, roundId, themeId, sectionId, fieldsToUpdate) {
    const sectionRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'themes', themeId, 'sections', sectionId)
    const updateObject = { ...fieldsToUpdate }

    await updateDoc(sectionRef, updateObject)
    console.log(`Game ${gameId}, Round ${roundId}, Theme ${themeId}, Section ${sectionId}:`, fieldsToUpdate)
}

/* ==================================================================================================== */
// READ
async function getFinaleSectionData(themeId, sectionId) {
    return getDocData('questions', themeId, 'sections', sectionId);
}

/* ==================================================================================================== */
/**
 * finale_home -> theme_active (question_active)
 */
export async function startFinaleTheme(gameId, roundId, nextThemeId) {
    if (!gameId) {
        throw new Error("No game ID has been provided!");
    }
    if (!roundId) {
        throw new Error("No round ID has been provided!");
    }
    if (!nextThemeId) {
        throw new Error("No theme ID has been provided!");
    }

    try {
        await runTransaction(firestore, transaction =>
            startFinaleThemeTransaction(transaction, gameId, roundId, nextThemeId)
        );
        console.log("Finale theme successfully started.");
    }
    catch (error) {
        console.error("There was an error starting the finale theme:", error);
        throw error;
    }
}

const startFinaleThemeTransaction = async (
    transaction,
    gameId,
    roundId,
    nextThemeId
) => {

    const roundRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId)
    const gameStatesRef = doc(GAMES_COLLECTION_REF, gameId, 'realtime', 'states')
    const nextThemeRef = doc(QUESTIONS_COLLECTION_REF, nextThemeId)

    const [finaleRoundData, gameStatesData, nextThemeData] = await Promise.all([
        getDocDataTransaction(transaction, roundRef),
        getDocDataTransaction(transaction, gameStatesRef),
        getDocDataTransaction(transaction, nextThemeRef)
    ])

    const { chooserOrder, chooserIdx } = gameStatesData
    const chooserTeamId = chooserOrder[chooserIdx]

    /* Fetch the order of the theme that just ended */
    const nextThemeOrder = (finaleRoundData.currentThemeOrder || 0) + 1

    const nextThemeRealtimeRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'themes', nextThemeId)
    transaction.update(nextThemeRealtimeRef, {
        dateStart: serverTimestamp(),
        order: nextThemeOrder,
        teamId: chooserTeamId,
        currentSectionIdx: 0,
    })

    /* Go to first section and first question of it */
    // await resetFinaleThemeStates(gameId, roundId, nextThemeId)
    const firstSectionId = nextThemeData.details.sections[0]
    const firstSectionRealtimeRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'themes', nextThemeId, 'sections', firstSectionId)
    transaction.update(firstSectionRealtimeRef, {
        currentQuestionIdx: 0,
        status: 'question_active'
    })

    const playersCollectionRef = collection(GAMES_COLLECTION_REF, gameId, 'players')
    let choosersSnapshot = await getDocs(query(playersCollectionRef, where('teamId', '==', chooserTeamId)))
    for (const playerDoc of choosersSnapshot.docs) {
        transaction.update(playerDoc.ref, { status: 'focus' })
    }

    /* Update round object */
    transaction.update(roundRef, {
        currentTheme: nextThemeId,
        currentThemeOrder: nextThemeOrder,
        status: 'theme_active'
    })

}


/* ==================================================================================================== */
/**
 * theme_active (question_active)
 * 
 * TODO: make status in a different array and update only this array
 */
export async function handleFinalePlayerAnswer(gameId, roundId, themeId, invalidate, organizerId) {
    if (!gameId) {
        throw new Error("No game ID has been provided!");
    }
    if (!roundId) {
        throw new Error("No round ID has been provided!");
    }
    if (!themeId) {
        throw new Error("No theme ID has been provided!");
    }
    if (invalidate === undefined) {
        throw new Error("No invalidate flag has been provided!");
    }
    if (!organizerId) {
        throw new Error("No organizer ID has been provided!");
    }

    try {
        await runTransaction(firestore, transaction =>
            handleFinalePlayerAnswerTransaction(transaction, gameId, roundId, themeId, invalidate, organizerId)
        );
        console.log("Finale player answer successfully handled.");
    }
    catch (error) {
        console.error("There was an error handling the finale player answer:", error);
        throw error;
    }
}

const handleFinalePlayerAnswerTransaction = async (
    transaction,
    gameId,
    roundId,
    themeId,
    invalidate,
    organizerId
) => {
    const roundRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId)
    const currentThemeRealtimeRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'themes', themeId)
    const currentThemeRef = doc(QUESTIONS_COLLECTION_REF, themeId)

    const [roundData, currentThemeRealtimeData, currentThemeData] = await Promise.all([
        getDocDataTransaction(transaction, roundRef),
        getDocDataTransaction(transaction, currentThemeRealtimeRef),
        getDocDataTransaction(transaction, currentThemeRef)
    ])

    const { rewardsPerQuestion: penalty } = roundData
    const { teamId, currentSectionIdx } = currentThemeRealtimeData
    const currentSectionId = currentThemeData.details.sections[currentSectionIdx]

    // Section: update questions[questionIdx].status
    const sectionRealtimeRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'themes', themeId, 'sections', currentSectionId)
    const sectionRealtimeData = await getDocDataTransaction(transaction, sectionRealtimeRef)

    const { currentQuestionIdx } = sectionRealtimeData

    // I want to update the question_status array as follows: it is the same except that at index CurrentQuestionIdx the element is "wrong" if invalidate is true, or "correct" if invalidate is false
    const updatedQuestionStatus = [...sectionRealtimeData.question_status]; // Create a copy of the array
    updatedQuestionStatus[currentQuestionIdx] = invalidate ? 'wrong' : 'correct';

    const playersCollectionRef = collection(GAMES_COLLECTION_REF, gameId, 'players')
    const choosersSnapshot = await getDocs(query(playersCollectionRef, where('teamId', '==', teamId)))

    transaction.update(sectionRealtimeRef, {
        question_status: updatedQuestionStatus,
        status: 'question_end'
    })

    // Players: update status
    for (const chooserDoc of choosersSnapshot.docs) {
        transaction.update(chooserDoc.ref, {
            status: invalidate ? 'wrong' : 'correct'
        })
    }

    if (invalidate) {
        await addSoundEffectTransaction(transaction, gameId, 'black_ops_knife_stab')

        const gameScoresRef = doc(GAMES_COLLECTION_REF, gameId, 'realtime', 'scores')
        transaction.update(gameScoresRef, {
            [`scores.${teamId}`]: increment(penalty)
        })

        const themeRealtimeRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'themes', themeId)
        transaction.update(themeRealtimeRef, {
            score: increment(penalty)
        })
    }

}

/* ==================================================================================================== */
export async function handleFinaleQuestionEndOrganizerContinue(gameId, roundId, themeId, sectionId, isLastQuestionInSection, isLastSectionInTheme, organizerId) {
    if (!gameId) {
        throw new Error("No game ID has been provided!");
    }
    if (!roundId) {
        throw new Error("No round ID has been provided!");
    }
    if (!themeId) {
        throw new Error("No theme ID has been provided!");
    }
    if (!sectionId) {
        throw new Error("No section ID has been provided!");
    }
    if (!organizerId) {
        throw new Error("No organizer ID has been provided!");
    }

    try {
        await runTransaction(firestore, transaction =>
            handleFinaleQuestionEndOrganizerContinueTransaction(transaction, gameId, roundId, themeId, sectionId, isLastQuestionInSection, isLastSectionInTheme, organizerId)
        );
        console.log("Finale question_end successfully handled.");
    }
    catch (error) {
        console.error("There was an error handling the finale question_end:", error);
        throw error;
    }
}

const handleFinaleQuestionEndOrganizerContinueTransaction = async (
    transaction,
    gameId,
    roundId,
    themeId,
    sectionId,
    isLastQuestionInSection,
    isLastSectionInTheme,
    organizerId,
) => {
    const currentThemeRealtimeRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'themes', themeId)
    const currentThemeRealtimeData = await getDocDataTransaction(transaction, currentThemeRealtimeRef)
    const { teamId } = currentThemeRealtimeData

    const playersCollectionRef = collection(GAMES_COLLECTION_REF, gameId, 'players')
    const choosersSnapshot = await getDocs(query(playersCollectionRef, where('teamId', '==', teamId)))

    /* Not the last question in section */
    if (!isLastQuestionInSection) {
        for (const chooserDoc of choosersSnapshot.docs) {
            transaction.update(chooserDoc.ref, {
                status: 'focus'
            })
        }
        // Display the next question
        const sectionRealtimeRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'themes', themeId, 'sections', sectionId)
        transaction.update(sectionRealtimeRef, {
            currentQuestionIdx: increment(1),
            status: 'question_active'
        })
        return
    }

    /* Last question in section, not the last section in the theme */
    if (!isLastSectionInTheme) {
        // Switch next section
        await switchFinaleThemeNextSectionTransaction(transaction, gameId, roundId, themeId)

        for (const playerDoc of choosersSnapshot.docs) {
            transaction.update(playerDoc.ref, {
                status: 'focus'
            })
        }
        return
    }

    /* Last question in section, Last section in the theme */
    // End the theme
    await endFinaleThemeTransaction(gameId, roundId, themeId, transaction)
    await addSoundEffectTransaction(transaction, gameId, 'level-passed')
}

/* ==================================================================================================== */
/**
 * theme_active (question_end) -> theme_active (question_active)
 */
export async function switchFinaleThemeNextSection(gameId, roundId, themeId) {
    if (!gameId) {
        throw new Error("No game ID has been provided!");
    }
    if (!roundId) {
        throw new Error("No round ID has been provided!");
    }
    if (!themeId) {
        throw new Error("No theme ID has been provided!");
    }

    try {
        await runTransaction(firestore, transaction =>
            switchFinaleThemeNextSectionTransaction(transaction, gameId, roundId, themeId)
        );
        console.log("Finale theme next section successfully switched.");
    }
    catch (error) {
        console.error("There was an error switching to the next section of the finale theme:", error);
        throw error;
    }
}

const switchFinaleThemeNextSectionTransaction = async (
    transaction,
    gameId,
    roundId,
    themeId,
) => {
    const themeRealtimeRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'themes', themeId)
    const themeRef = doc(QUESTIONS_COLLECTION_REF, themeId)

    const [theme, themeRealtime] = await Promise.all([
        getDocDataTransaction(transaction, themeRef),
        getDocDataTransaction(transaction, themeRealtimeRef)
    ])

    const { currentSectionIdx } = themeRealtime
    const nextSectionIdx = currentSectionIdx + 1
    const nextSectionId = theme.details.sections[nextSectionIdx]

    transaction.update(themeRealtimeRef, {
        currentSectionIdx: nextSectionIdx,
    })

    const nextSectionRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'themes', themeId, 'sections', nextSectionId)
    transaction.update(nextSectionRef, {
        currentQuestionIdx: 0,
        status: 'question_active'
    })
}

/* ==================================================================================================== */
/**
 * theme_active -> theme_end
 */
export async function endFinaleTheme(gameId, roundId, themeId) {
    if (!gameId) {
        throw new Error("No game ID has been provided!");
    }
    if (!roundId) {
        throw new Error("No round ID has been provided!");
    }
    if (!themeId) {
        throw new Error("No theme ID has been provided!");
    }

    try {
        await runTransaction(firestore, transaction =>
            endFinaleThemeTransaction(gameId, roundId, themeId, transaction)
        );
        console.log("Finale theme successfully ended.");
    }
    catch (error) {
        console.error("There was an error ending the finale theme:", error);
        throw error;
    }
}

const endFinaleThemeTransaction = async (
    gameId,
    roundId,
    themeId,
    transaction
) => {
    const themeRealtimeRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'themes', themeId)
    const gameStatesRef = doc(GAMES_COLLECTION_REF, gameId, 'realtime', 'states')

    const [themeRealtime, gameStatesData] = await Promise.all([
        getDocDataTransaction(transaction, themeRealtimeRef),
        getDocDataTransaction(transaction, gameStatesRef)
    ])

    const { chooserOrder, chooserIdx } = gameStatesData
    const chooserTeamId = chooserOrder[chooserIdx]
    const newChooserIdx = getNextCyclicIndex(chooserIdx, chooserOrder.length)
    const newChooserTeamId = chooserOrder[newChooserIdx]
    // assert chooserTeamId === themeData.teamId
    // assert newChooserTeamId !== chooserTeamId

    const playersCollectionRef = collection(GAMES_COLLECTION_REF, gameId, 'players')

    const newChoosersSnapshot = await getDocs(query(playersCollectionRef, where('teamId', '==', newChooserTeamId)))
    const prevChoosersSnapshot = await getDocs(query(playersCollectionRef, where('teamId', '==', chooserTeamId)))

    for (const playerDoc of newChoosersSnapshot.docs) {
        transaction.update(playerDoc.ref, {
            status: 'focus'
        })
    }
    for (const playerDoc of prevChoosersSnapshot.docs) {
        transaction.update(playerDoc.ref, {
            status: 'idle'
        })
    }

    transaction.update(themeRealtimeRef, {
        dateEnd: serverTimestamp()
    })

    transaction.update(gameStatesRef, {
        chooserIdx: newChooserIdx
    })

    const roundScoresRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'realtime', 'scores')
    transaction.update(roundScoresRef, {
        [`scores.${themeRealtime.teamId}`]: increment(themeRealtime.score)
    })

    const roundRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId)
    transaction.update(roundRef, {
        status: 'theme_end',
    })
}

/* ==================================================================================================== */
/**
 * theme_end -> finale_home
 */
export async function goBackFinaleHome(gameId, roundId) {
    updateRoundFields(gameId, roundId, {
        status: 'finale_home',
    })
}


/* ============================================================================================== */
export async function resetFinaleRound(gameId, roundId) {
    await resetRoundInfo(gameId, roundId)

    await initRoundScores(gameId, roundId)

    await updateRoundFields(gameId, roundId, {
        currentTheme: null,
        status: 'finale_home'
    })

    const themeRealtimesCollectionRef = collection(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'themes')
    const themeRealtimesSnapshot = await getDocs(query(themeRealtimesCollectionRef))
    for (const themeRealtimeDoc of themeRealtimesSnapshot.docs) {
        await resetFinaleTheme(gameId, roundId, themeRealtimeDoc.id)
    }
}


async function resetFinaleTheme(gameId, roundId, themeId) {
    await updateFinaleThemeRealtime(gameId, roundId, themeId, {
        dateEnd: null,
        dateStart: null,
        order: null,
        score: 0,
        teamId: null,
        currentSectionIdx: 0,
    })

    const sectionsCollectionRef = collection(QUESTIONS_COLLECTION_REF, themeId, 'sections')
    const sectionsSnapshot = await getDocs(query(sectionsCollectionRef))
    for (const sectionDoc of sectionsSnapshot.docs) {
        const sectionRealtimeRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'themes', themeId, 'sections', sectionDoc.id)
        // Set the section to its initial state
        await setDoc(sectionRealtimeRef, {
            currentQuestionIdx: 0,
            question_status: Array(sectionDoc.data().questions.length).fill(null),
            status: 'question_active'
        })
    }
}

