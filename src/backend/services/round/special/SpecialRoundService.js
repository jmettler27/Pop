import RoundService from '@/backend/services/round/RoundService'


// import { GAMES_COLLECTION_REF, QUESTIONS_COLLECTION_REF } from '@/backend/firebase/firestore';
// import { firestore } from '@/backend/firebase/firebase'
// import {
//     collection,
//     query,
//     where,
//     getDocs,
//     doc,
//     increment,
//     serverTimestamp,
//     runTransaction,
//     setDoc,
// } from 'firebase/firestore'

// import { GameStatus } from '@/backend/models/games/GameStatus';
// import { PlayerStatus } from '@/backend/models/users/Player';

// import { getDocDataTransaction } from '@/backend/services/utils';
// import { resetRoundInfo, updateRoundFields } from '@/backend/services/round/actions';
// import { initRoundScores } from '@/backend/services/scoring/scores';
// import { getNextCyclicIndex } from '@/backend/utils/arrays';
// import { SpecialRoundStatus } from '@/backend/models/rounds/Special';


export default class SpecialRoundService extends RoundService {

    constructor(gameId, roundId) {
        super(gameId, roundId)
    }

    async startRoundTransaction(transaction) {
        // const specialRoundRef = doc(GAMES_COLLECTION_REF, this.gameId, 'rounds', this.roundId)
        // transaction.update(specialRoundRef, {
        //     dateStart: serverTimestamp(),
        //     status: SpecialRoundStatus.HOME
        // })
    
        // await updateGameStatusTransaction(transaction, this.gameId,  SpecialRoundStatus.HOME)
        // await this.soundRepo.addSoundTransaction(transaction, this.gameId, 'ui-confirmation-alert-b2')

        // console.log("Special round successfully started.");
    }

    async resetRoundTransaction(transaction) {
        // await resetRoundInfo(gameId, roundId)

        // await initRoundScores(gameId, roundId)
    
        // await updateRoundFields(gameId, roundId, {
        //     currentTheme: null,
        //     status: 'special_home'
        // })
    
        // const gameThemesCollectionRef = collection(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'themes')
        // const gameThemesSnapshot = await getDocs(query(gameThemesCollectionRef))
        // for (const gameThemeDoc of gameThemesSnapshot.docs) {
        //     await resetTheme(gameId, roundId, gameThemeDoc.id)
        // }
    }

    async calculateMaxPointsTransaction(transaction, round) {
        return round.questions.length * (round.rewardsPerQuestion + round.rewardsForBonus)
    }
    
    /* ==================================================================================================== */

    async startTheme(nextThemeId) {
        // if (!nextThemeId) {
        //     throw new Error("No theme ID has been provided!");
        // }
    
        // try {
        //     await runTransaction(firestore, transaction =>
        //         this.startThemeTransaction(transaction, nextThemeId)
        //     );
        //     console.log("Special theme successfully started.");
        // }
        // catch (error) {
        //     console.error("There was an error starting the special theme:", error);
        //     throw error;
        // }
    }
    async startThemeTransaction(transaction, nextThemeId) {
    
        // const roundRef = doc(GAMES_COLLECTION_REF, this.gameId, 'rounds', this.roundId)
        // const chooserRef = doc(GAMES_COLLECTION_REF, this.gameId, 'realtime', 'states')
        // const nextThemeRef = doc(QUESTIONS_COLLECTION_REF, nextThemeId)
    
        // const [specialRoundData, chooserData, nextThemeData] = await Promise.all([
        //     getDocDataTransaction(transaction, roundRef),
        //     getDocDataTransaction(transaction, chooserRef),
        //     getDocDataTransaction(transaction, nextThemeRef)
        // ])
    
        // const { chooserOrder, chooserIdx } = chooserData
        // const chooserTeamId = chooserOrder[chooserIdx]
    
        // /* Fetch the order of the theme that just ended */
        // const nextThemeOrder = (specialRoundData.currentThemeOrder || 0) + 1
    
        // const nextGameThemeRef = doc(GAMES_COLLECTION_REF, this.gameId, 'rounds', this.roundId, 'themes', nextThemeId)
        // transaction.update(nextGameThemeRef, {
        //     dateStart: serverTimestamp(),
        //     order: nextThemeOrder,
        //     teamId: chooserTeamId,
        //     currentSectionIdx: 0,
        // })
    
        // /* Go to first section and first question of it */
        // // await resetThemeStates(gameId, roundId, nextThemeId)
        // const firstSectionId = nextThemeData.details.sections[0]
        // const firstGameSectionRef = doc(GAMES_COLLECTION_REF, this.gameId, 'rounds', this.roundId, 'themes', nextThemeId, 'sections', firstSectionId)
        // transaction.update(firstGameSectionRef, {
        //     currentQuestionIdx: 0,
        //     status: GameStatus.QUESTION_ACTIVE
        // })
    
        // const playersCollectionRef = collection(GAMES_COLLECTION_REF, this.gameId, 'players')
        // let choosersSnapshot = await getDocs(query(playersCollectionRef, where('teamId', '==', chooserTeamId)))
        // for (const playerDoc of choosersSnapshot.docs) {
        //     transaction.update(playerDoc.ref, { status: PlayerStatus.FOCUS })
        // }
    
        // /* Update round object */
        // transaction.update(roundRef, {
        //     currentTheme: nextThemeId,
        //     currentThemeOrder: nextThemeOrder,
        //     status: GameStatus.THEME_ACTIVE
        // })
    
    }

    async handlePlayerAnswer(themeId, invalidate, organizerId) {
        // if (!themeId) {
        //     throw new Error("No theme ID has been provided!");
        // }
        // if (invalidate === undefined) {
        //     throw new Error("No invalidate flag has been provided!");
        // }
        // if (!organizerId) {
        //     throw new Error("No organizer ID has been provided!");
        // }
    
        // try {
        //     await runTransaction(firestore, async (transaction) => {
        //         const roundRef = doc(GAMES_COLLECTION_REF, this.gameId, 'rounds', this.roundId)
        //         const currentGameThemeRef = doc(GAMES_COLLECTION_REF, this.gameId, 'rounds', this.roundId, 'themes', themeId)
        //         const currentThemeRef = doc(QUESTIONS_COLLECTION_REF, themeId)
            
        //         const [roundData, currentGameTheme, currentThemeData] = await Promise.all([
        //             getDocDataTransaction(transaction, roundRef),
        //             getDocDataTransaction(transaction, currentGameThemeRef),
        //             getDocDataTransaction(transaction, currentThemeRef)
        //         ])
            
        //         const { rewardsPerQuestion: penalty } = roundData
        //         const { teamId, currentSectionIdx } = currentGameTheme
        //         const currentSectionId = currentThemeData.details.sections[currentSectionIdx]
            
        //         // Section: update questions[questionIdx].status
        //         const gameSectionRef = doc(GAMES_COLLECTION_REF, this.gameId, 'rounds', this.roundId, 'themes', themeId, 'sections', currentSectionId)
        //         const gameSectionData = await getDocDataTransaction(transaction, gameSectionRef)
            
        //         const { currentQuestionIdx } = gameSectionData
            
        //         // I want to update the question_status array as follows: it is the same except that at index CurrentQuestionIdx the element is "wrong" if invalidate is true, or "correct" if invalidate is false
        //         const updatedQuestionStatus = [...gameSectionData.question_status]; // Create a copy of the array
        //         updatedQuestionStatus[currentQuestionIdx] = invalidate ? 'wrong' : 'correct';
            
        //         const playersCollectionRef = collection(GAMES_COLLECTION_REF, this.gameId, 'players')
        //         const choosersSnapshot = await getDocs(query(playersCollectionRef, where('teamId', '==', teamId)))
            
        //         transaction.update(gameSectionRef, {
        //             question_status: updatedQuestionStatus,
        //             status: GameStatus.QUESTION_END
        //         })
            
        //         // Players: update status
        //         for (const chooserDoc of choosersSnapshot.docs) {
        //             transaction.update(chooserDoc.ref, {
        //                 status: invalidate ? 'wrong' : 'correct'
        //             })
        //         }
            
        //         if (invalidate) {
        //             await this.soundRepo.addSoundTransaction(transaction, this.gameId, 'black_ops_knife_stab')
            
        //             const gameScoresRef = doc(GAMES_COLLECTION_REF, this.gameId, 'realtime', 'scores')
        //             transaction.update(gameScoresRef, {
        //                 [`scores.${teamId}`]: increment(penalty)
        //             })
            
        //             const gameThemeRef = doc(GAMES_COLLECTION_REF, this.gameId, 'rounds', this.roundId, 'themes', themeId)
        //             transaction.update(gameThemeRef, {
        //                 score: increment(penalty)
        //             })
        //         }
    
        //         console.log("Special player answer successfully handled.");
        //     });
        // }
        // catch (error) {
        //     console.error("There was an error handling the special player answer:", error);
        //     throw error;
        // }
    }
    
    async handleQuestionEndOrganizerContinue(themeId, sectionId, isLastQuestionInSection, isLastSectionInTheme, organizerId) {
        // if (!themeId) {
        //     throw new Error("No theme ID has been provided!");
        // }
        // if (!sectionId) {
        //     throw new Error("No section ID has been provided!");
        // }
        // if (!organizerId) {
        //     throw new Error("No organizer ID has been provided!");
        // }
    
        // try {
        //     await runTransaction(firestore, async (transaction) => {
        //         const currentGameThemeRef = doc(GAMES_COLLECTION_REF, this.gameId, 'rounds', this.roundId, 'themes', themeId)
        //         const currentGameTheme = await getDocDataTransaction(transaction, currentGameThemeRef)
        //         const { teamId } = currentGameTheme
            
        //         const playersCollectionRef = collection(GAMES_COLLECTION_REF, this.gameId, 'players')
        //         const choosersSnapshot = await getDocs(query(playersCollectionRef, where('teamId', '==', teamId)))
            
        //         /* Not the last question in section */
        //         if (!isLastQuestionInSection) {
        //             for (const chooserDoc of choosersSnapshot.docs) {
        //                 transaction.update(chooserDoc.ref, {
        //                     status: PlayerStatus.FOCUS
        //                 })
        //             }
        //             // Display the next question
        //             const gameSectionRef = doc(GAMES_COLLECTION_REF, this.gameId, 'rounds', this.roundId, 'themes', themeId, 'sections', sectionId)
        //             transaction.update(gameSectionRef, {
        //                 currentQuestionIdx: increment(1),
        //                 status: GameStatus.QUESTION_ACTIVE
        //             })
        //             return
        //         }
            
        //         /* Last question in section, not the last section in the theme */
        //         if (!isLastSectionInTheme) {
        //             // Switch next section
        //             await this.switchThemeNextSectionTransaction(transaction, themeId)
            
        //             for (const playerDoc of choosersSnapshot.docs) {
        //                 transaction.update(playerDoc.ref, {
        //                     status: PlayerStatus.FOCUS
        //                 })
        //             }
        //             return
        //         }
            
        //         /* Last question in section, Last section in the theme */
        //         // End the theme
        //         await this.endThemeTransaction(transaction, themeId)
        //         await this.soundRepo.addSoundTransaction(transaction, 'level-passed')
    
        //         console.log("Special question_end successfully handled.");
        //     });
        // }
        // catch (error) {
        //     console.error("There was an error handling the special question_end:", error);
        //     throw error;
        // }
    }
    
    async switchThemeNextSection(themeId) {
        // if (!themeId) {
        //     throw new Error("No theme ID has been provided!");
        // }
    
        // try {
        //     await runTransaction(firestore, async (transaction) => {
        //         const gameThemeRef = doc(GAMES_COLLECTION_REF, this.gameId, 'rounds', this.roundId, 'themes', themeId)
        //         const themeRef = doc(QUESTIONS_COLLECTION_REF, themeId)
            
        //         const [theme, gameTheme] = await Promise.all([
        //             getDocDataTransaction(transaction, themeRef),
        //             getDocDataTransaction(transaction, gameThemeRef)
        //         ])
            
        //         const { currentSectionIdx } = gameTheme
        //         const nextSectionIdx = currentSectionIdx + 1
        //         const nextSectionId = theme.details.sections[nextSectionIdx]
            
        //         transaction.update(gameThemeRef, {
        //             currentSectionIdx: nextSectionIdx,
        //         })
            
        //         const nextSectionRef = doc(GAMES_COLLECTION_REF, this.gameId, 'rounds', this.roundId, 'themes', themeId, 'sections', nextSectionId)
        //         transaction.update(nextSectionRef, {
        //             currentQuestionIdx: 0,
        //             status: GameStatus.QUESTION_ACTIVE
        //         })
            
        //         console.log("Special theme next section successfully switched.");
        //     });
        // }
        // catch (error) {
        //     console.error("There was an error switching to the next section of the special theme:", error);
        //     throw error;
        // }
    }
    
    async resetTheme(themeId) {
        // await this.updateGameTheme(this.gameId, this.roundId, themeId, {
        //     dateEnd: null,
        //     dateStart: null,
        //     order: null,
        //     score: 0,
        //     teamId: null,
        //     currentSectionIdx: 0,
        // })
    
        // const sectionsCollectionRef = collection(QUESTIONS_COLLECTION_REF, themeId, 'sections')
        // const sectionsSnapshot = await getDocs(query(sectionsCollectionRef))
        // for (const sectionDoc of sectionsSnapshot.docs) {
        //     const gameSectionRef = doc(GAMES_COLLECTION_REF, this.gameId, 'rounds', this.roundId, 'themes', themeId, 'sections', sectionDoc.id)
        //     // Set the section to its initial state
        //     await setDoc(gameSectionRef, {
        //         currentQuestionIdx: 0,
        //         question_status: Array(sectionDoc.data().questions.length).fill(null),
        //         status: GameStatus.QUESTION_ACTIVE
        //     })
        // }
    }

    async endTheme(themeId) {
        // if (!themeId) {
        //     throw new Error("No theme ID has been provided!");
        // }
    
        // try {
        //     await runTransaction(firestore, async (transaction) => {
        //         const gameThemeRef = doc(GAMES_COLLECTION_REF, this.gameId, 'rounds', this.roundId, 'themes', themeId)
        //         const chooserRef = doc(GAMES_COLLECTION_REF, this.gameId, 'realtime', 'states')
            
        //         const [gameTheme, chooserData] = await Promise.all([
        //             getDocDataTransaction(transaction, gameThemeRef),
        //             getDocDataTransaction(transaction, chooserRef)
        //         ])
            
        //         const { chooserOrder, chooserIdx } = chooserData
        //         const chooserTeamId = chooserOrder[chooserIdx]
        //         const newChooserIdx = getNextCyclicIndex(chooserIdx, chooserOrder.length)
        //         const newChooserTeamId = chooserOrder[newChooserIdx]
        //         // assert chooserTeamId === themeData.teamId
        //         // assert newChooserTeamId !== chooserTeamId
            
        //         const playersCollectionRef = collection(GAMES_COLLECTION_REF, this.gameId, 'players')
            
        //         const newChoosersSnapshot = await getDocs(query(playersCollectionRef, where('teamId', '==', newChooserTeamId)))
        //         const prevChoosersSnapshot = await getDocs(query(playersCollectionRef, where('teamId', '==', chooserTeamId)))
            
        //         for (const playerDoc of newChoosersSnapshot.docs) {
        //             transaction.update(playerDoc.ref, {
        //                 status: PlayerStatus.FOCUS
        //             })
        //         }
        //         for (const playerDoc of prevChoosersSnapshot.docs) {
        //             transaction.update(playerDoc.ref, {
        //                 status: PlayerStatus.IDLE
        //             })
        //         }
            
        //         transaction.update(gameThemeRef, {
        //             dateEnd: serverTimestamp()
        //         })
            
        //         transaction.update(chooserRef, {
        //             chooserIdx: newChooserIdx
        //         })
            
        //         const roundScoresRef = doc(GAMES_COLLECTION_REF, this.gameId, 'rounds', this.roundId, 'realtime', 'scores')
        //         transaction.update(roundScoresRef, {
        //             [`scores.${gameTheme.teamId}`]: increment(gameTheme.score)
        //         })
            
        //         const roundRef = doc(GAMES_COLLECTION_REF, this.gameId, 'rounds', this.roundId)
        //         transaction.update(roundRef, {
        //             status: 'theme_end',
        //         })
    
        //         console.log("Special theme successfully ended.");
        //     });
        // }
        // catch (error) {
        //     console.error("There was an error ending the special theme:", error);
        //     throw error;
        // }
    }
    
    async goHome() {
        // await updateRoundFields(this.gameId, this.roundId, {
        //     status: 'special_home',
        // })
    }
    
}

