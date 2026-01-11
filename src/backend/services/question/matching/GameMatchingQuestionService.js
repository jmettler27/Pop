import GameQuestionService from '@/backend/services/question/GameQuestionService';

import ChooserRepository from '@/backend/repositories/user/ChooserRepository';

import { ScorePolicyType } from '@/backend/models/ScorePolicy';

import { findNextAvailableChooser } from '@/backend/utils/arrays';

import { getDocs, query, where } from 'firebase/firestore';
import { PlayerStatus } from '@/backend/models/users/Player';
import { GameMatchingQuestion } from '@/backend/models/questions/Matching';


export default class GameMatchingQuestionService extends GameQuestionService {

    constructor(gameId, roundId) {
        super(gameId, roundId);
        
        this.chooserRepo = new ChooserRepository(gameId);
    }

    async resetQuestionTransaction(transaction, questionId) {
        const chooser = await this.chooserRepo.resetChoosersTransaction(transaction)
        
        await this.gameQuestionRepo.resetQuestionTransaction(transaction, questionId)
        await this.playerRepo.updateTeamPlayersStatusTransaction(transaction, chooser.teamId, PlayerStatus.IDLE)
        
        await super.resetQuestionTransaction(transaction, questionId)

        console.log("Matching question successfully reset", questionId)
    }

    async handleCountdownEndTransaction(transaction, questionId) {
        const baseQuestion = await this.baseQuestionRepo.getQuestionTransaction(transaction, questionId);
        const correctMatches = await this.gameQuestionRepo.getCorrectMatchesTransaction(transaction, questionId);
        const incorrectMatches = await this.gameQuestionRepo.getIncorrectMatchesTransaction(transaction, questionId);

        const correctMatchIndices = correctMatches.map(obj => obj.matchIdx)
        const incorrectMatch = incorrectMatches.map(obj => obj.match)
        const match = GameMatchingQuestion.generateMatch(baseQuestion.numRows, baseQuestion.numCols, incorrectMatch, correctMatchIndices);
    
        await this.submitMatchTransaction(transaction, questionId, 'system', null, match)

        console.log("Matching question countdown end successfully handled", questionId)
        
    }

    async endQuestionTransaction(transaction, questionId) {
        await super.endQuestionTransaction(transaction, questionId)

        console.log("Matching question successfully ended", questionId)
    }

    /* ============================================================================================================ */

    async submitMatch(questionId, userId, edges, match) {
        if (!questionId) {
            throw new Error("No question ID has been provided!");
        }
        if (!userId) {
            throw new Error("No user ID has been provided!");
        }
        if ((!edges || edges.length === 0) && (!match || match.length === 0)) {
            throw new Error("No edges nor rows have been provided!");
        }
    
        try {
            await runTransaction(firestore, transaction => submitMatchTransaction(transaction, questionId, userId, edges, match))
        } catch (error) {
            console.error("There was an error handling the matching submission:", error);
            throw error;
        }
    }

    async submitMatchTransaction(transaction, questionId, userId, edges, match) {
        const { chooserOrder, chooserIdx } = await this.chooserRepo.getChooserTransaction(transaction, this.gameId)
        const teamId = chooserOrder[chooserIdx]

        // edges is an array of numCols objects of the form {from: origRow0_col0, to: origRow1_col1}
        const rows = match || edges.flatMap((edge, idx) => {
            const fromNumericPart = parseInt(edge.from.match(/\d+/)[0]);
            const toNumericPart = parseInt(edge.to.match(/\d+/)[0]);
            return (idx === 0) ?
                [fromNumericPart, toNumericPart] :
                [toNumericPart]
        });

        const isCorrect = rows.every(row => row === rows[0])


        const playersCollectionRef = collection(GAMES_COLLECTION_REF, gameId, 'players')
        const choosersSnapshot = await getDocs(query(playersCollectionRef, where('teamId', '==', teamId)))
    
        const correctMatchesRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId, 'realtime', 'correct')
        const roundScoresRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'realtime', 'scores')
    
    

        if (isCorrect) {
            // Case 1: The matching is correct
            await this.handleCorrectMatchTransaction(transaction, questionId, userId, teamId, rows)
        } else {
            // Case 2: The matching is incorrect
            await this.handleIncorrectMatchTransaction(transaction, questionId, userId, teamId, rows)
        }
        // await updateTimerStateTransaction(transaction, gameId, TimerStatus.RESET)
        console.log("Matching submission handled successfully.")
    }

    async handleCorrectMatchTransaction(transaction, questionId, userId, teamId, rows) {

        const correctMatches = await this.gameQuestionRepo.getCorrectMatchesTransaction(transaction, questionId)
        const baseQuestion = await this.baseQuestionRepo.getQuestionTransaction(transaction, questionId)

        const isLastCorrectMatch = correctMatches.length === baseQuestion.numRows - 1

        if (isLastCorrectMatch) {
            // Case 1.2: It is the last correct matching
            const roundScores = await this.roundRepo.getRoundScoresTransaction(transaction, this.gameId, this.roundId)
            const { scores: currentRoundScores } = roundScores
            await this.roundRepo.increaseRoundTeamScoreTransaction(transaction, this.gameId, this.roundId, questionId, teamId, 0)

            for (const chooserDoc of choosersSnapshot.docs) {
                transaction.update(chooserDoc.ref, { status: 'correct' })
            }

            // Log the match
            transaction.update(correctMatchesRef, {
                correctMatches: arrayUnion({
                    matchIdx: rows[0],
                    userId,
                    teamId,
                    timestamp: Timestamp.now(),
                })
            })

            const sortedUniqueRoundScores = sortScores(currentRoundScores, sortAscendingRoundScores('matching'));
            const roundSortedTeams = aggregateTiedTeams(sortedUniqueRoundScores, currentRoundScores);
            const newChooserOrder = roundSortedTeams.slice().reverse().flatMap(({ teams }) => shuffle(teams));
            transaction.update(gameStatesRef, {
                chooserOrder: newChooserOrder,
            })

            await addSoundEffectTransaction(transaction, gameId, 'zelda_secret_door')
            await endQuestionTransaction(transaction, gameId, roundId, questionId)

        } else {
            // Case 1.1: The matching is correct but not the last one

            // Switch to the next competing team
            const questionRealtimeRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId)
            const questionRealtimeData = await getDocDataTransaction(transaction, questionRealtimeRef)
            const { canceled } = questionRealtimeData
            const { newChooserIdx, newChooserTeamId } = findNextAvailableChooser(chooserIdx, chooserOrder, canceled)
            const newChoosersSnapshot = await getDocs(query(playersCollectionRef, where('teamId', '==', newChooserTeamId)))

            transaction.update(gameStatesRef, {
                chooserIdx: newChooserIdx
            })

            for (const newChooserDoc of newChoosersSnapshot.docs) {
                transaction.update(newChooserDoc.ref, {
                    status: 'focus'
                })
            }
            if (newChooserTeamId !== teamId) {
                for (const chooserDoc of choosersSnapshot.docs) {
                    transaction.update(chooserDoc.ref, { status: 'idle' })
                }
            }

            // Log the match
            transaction.update(correctMatchesRef, {
                correctMatches: arrayUnion({
                    matchIdx: rows[0],
                    userId,
                    teamId,
                    timestamp: Timestamp.now(),
                })
            })

            // Sound effect
            await addSoundEffectTransaction(transaction, gameId, 'OUI')
        }
    }
        
    async handleIncorrectMatchTransaction(transaction, questionId, userId, teamId, rows) {
        // Case 2: The matching is incorrect
        const gameRef = doc(GAMES_COLLECTION_REF, gameId)
        const roundRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId)
        const questionRealtimeRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId)
        const roundScoresRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'realtime', 'scores')
        const [gameData, roundData, questionRealtimeData, roundScoresData] = await Promise.all([
            getDocDataTransaction(transaction, gameRef),
            getDocDataTransaction(transaction, roundRef),
            getDocDataTransaction(transaction, questionRealtimeRef),
            getDocDataTransaction(transaction, roundScoresRef)
        ])

        const { roundScorePolicy } = gameData
        const { mistakePenalty: penalty } = roundData
        const { teamNumMistakes, canceled } = questionRealtimeData

        // Increase the number of mistakes of the team
        const newTeamNumMistakes = { ...teamNumMistakes }
        newTeamNumMistakes[teamId] = (teamNumMistakes[teamId] || 0) + 1

        // If the team has reached the maximum number of mistakes, cancel it
        const isCanceled = matchingTeamIsCanceled(teamId, newTeamNumMistakes, roundData.maxMistakes)
        const newCanceled = isCanceled ? [...canceled, teamId] : canceled;

        if (roundScorePolicy === 'ranking') {
            // Increase the team's round score to 1
            await increaseRoundTeamScoreTransaction(transaction, gameId, roundId, questionId, teamId, penalty)
        }
        else if (roundScorePolicy === 'completion_rate') {
            // Decrease the team's global score by the penalty and increment the number of mistakes of the team in the round
            await decreaseGlobalTeamScoreTransaction(transaction, gameId, roundId, questionId, penalty, teamId)
        }

        // Update the mistake and canceled information
        transaction.update(questionRealtimeRef, {
            teamNumMistakes: newTeamNumMistakes,
            canceled: newCanceled
        })


        // Log the match
        const numCols = rows.length
        if (numCols > 2) {
            const [colIndices, rowIdx] = findMostFrequentValueAndIndices(rows)
            if (colIndices.length > 0 && rowIdx !== null) {
                const partiallyCorrectMatchesRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId, 'realtime', 'partially_correct')
                transaction.update(partiallyCorrectMatchesRef, {
                    partiallyCorrectMatches: arrayUnion({
                        colIndices,
                        matchIdx: rowIdx,
                        userId,
                        teamId,
                        timestamp: Timestamp.now(),
                    })
                })
            }
        }
        const incorrectMatchesRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId, 'realtime', 'incorrect')
        transaction.update(incorrectMatchesRef, {
            incorrectMatches: arrayUnion({
                match: rows,
                userId,
                teamId,
                timestamp: Timestamp.now(),
            }),
        })

        // Switch to the next competing team, or end the question if all teams have been canceled

        if (newCanceled.length < chooserOrder.length) {
            // There are still competing teams => Set focus to the next competing team

            const { newChooserIdx, newChooserTeamId } = findNextAvailableChooser(chooserIdx, chooserOrder, newCanceled)
            const newChoosersSnapshot = await getDocs(query(playersCollectionRef, where('teamId', '==', newChooserTeamId)))

            transaction.update(gameStatesRef, {
                chooserIdx: newChooserIdx
            })
            for (const newChooserDoc of newChoosersSnapshot.docs) {
                transaction.update(newChooserDoc.ref, {
                    status: 'focus'
                })
            }

            for (const chooserDoc of choosersSnapshot.docs) {
                transaction.update(chooserDoc.ref, { status: isCanceled ? 'wrong' : 'idle' })
            }

            await addSoundEffectTransaction(transaction, gameId, isCanceled ? 'zelda_wind_waker_kaboom' : 'zelda_wind_waker_sploosh')

        } else {
            // All teams have been canceled => End the question

            const { scores: currentRoundScores } = roundScoresData
            const sortedUniqueRoundScores = sortScores(currentRoundScores, sortAscendingRoundScores('matching'));
            const roundSortedTeams = aggregateTiedTeams(sortedUniqueRoundScores, currentRoundScores);
            const newChooserOrder = roundSortedTeams.slice().reverse().flatMap(({ teams }) => shuffle(teams));
            transaction.update(gameStatesRef, {
                chooserOrder: newChooserOrder,
            })

            for (const chooserDoc of choosersSnapshot.docs) {
                transaction.update(chooserDoc.ref, { status: 'wrong' })
            }

            await addSoundEffectTransaction(transaction, gameId, 'zelda_wind_waker_game_over')

            await endQuestionTransaction(transaction, gameId, roundId, questionId)
        }

    }
    
}
