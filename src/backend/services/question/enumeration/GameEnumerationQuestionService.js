import GameQuestionService from "@/backend/services/question/GameQuestionService";

import {collection, documentId, getDocs, query, runTransaction, where} from 'firebase/firestore'

import {TimerStatus} from '@/backend/models/Timer';
import {PlayerStatus} from '@/backend/models/users/Player';
import {EnumerationQuestionStatus, GameEnumerationQuestion} from '@/backend/models/questions/Enumeration';
import {firestore} from "@/backend/firebase/firebase";
import {QuestionType} from "@/backend/models/questions/QuestionType";


export default class GameEnumerationQuestionService extends GameQuestionService {
 
    constructor(gameId, roundId) {
        super(gameId, roundId, QuestionType.ENUMERATION);
    }

    async resetQuestionTransaction(transaction, questionId) {

        await this.gameQuestionRepo.setPlayersTransaction(transaction, questionId, {
            bets: [],
        })
    
        await this.gameQuestionRepo.updateQuestionTransaction(transaction, questionId, {
            status: EnumerationQuestionStatus.REFLECTION,
            winner: null,
        })
    
        await this.timerRepo.resetTimerTransaction(transaction)

        await this.playerRepo.updateAllPlayersStatusTransaction(transaction, PlayerStatus.IDLE)

        await super.resetQuestionTransaction(transaction, questionId)

        console.log("Enumeration question successfully reset", questionId)
    }

    async handleCountdownEndTransaction(transaction, questionId) {
        const gameQuestion = await this.gameQuestionRepo.getQuestionTransaction(transaction, questionId)
        const { status } = gameQuestion
        if (status === EnumerationQuestionStatus.REFLECTION) {
            await this.endReflectionTransaction(transaction, questionId)
        } else if (status === EnumerationQuestionStatus.CHALLENGE) {
            await this.endQuestionTransaction(transaction, questionId)
        }
        console.log("Enumeration question countdown end successfully handled", questionId)
    }

    async endQuestionTransaction(transaction, questionId) {
        const round = await this.roundRepo.getRoundTransaction(transaction, roundId)
        const roundScores = await this.roundScoreRepo.getScoresTransaction(transaction, roundId)
        const questionPlayers = await this.gameQuestionRepo.getPlayersTransaction(transaction, questionId)

        const { challenger } = questionPlayers
        const { teamId, playerId, numCorrect, bet } = challenger
    
        const { scores: currentRoundScores, scoresProgress: currentRoundProgress } = roundScores
    
        const challengers = await this.playerRepo.getPlayersByTeamIdTransaction(transaction, teamId)
        const spectators = await this.playerRepo.getPlayersByTeamIdTransaction(transaction, teamId)
        
    
        if (numCorrect < bet) {
            // The challenger did not succeed in its challenge
            const reward = round.rewardsPerQuestion
            
            for (const challenger of challengers) {
                await this.playerRepo.updatePlayerStatusTransaction(transaction, challenger.id, PlayerStatus.WRONG)
            }
            const newRoundScores = {}
            const newRoundProgress = {}
            newRoundScores[teamId] = currentRoundScores[teamId] || 0
            newRoundProgress[teamId] = {
                ...currentRoundProgress[teamId],
                [questionId]: currentRoundScores[teamId] || 0
            }
    
            const spectatorsSnapshot = await getDocs(query(playersCollectionRef, where('teamId', '!=', teamId)))
            for (const spectatorDoc of spectatorsSnapshot.docs) {
                transaction.update(spectatorDoc.ref, {
                    status: PlayerStatus.CORRECT
                })
            }
            const teamsCollectionRef = collection(GAMES_COLLECTION_REF, gameId, 'teams')
            const spectatorTeamsSnapshot = await getDocs(query(teamsCollectionRef, where(documentId(), '!=', teamId)))
            for (const spectatorTeamDoc of spectatorTeamsSnapshot.docs) {
                const stid = spectatorTeamDoc.id
                newRoundProgress[stid] = {
                    ...currentRoundProgress[stid],
                    [questionId]: currentRoundScores[stid] + reward
                }
                newRoundScores[stid] = currentRoundScores[stid] + reward
            }
    
            await this.roundScoreRepo.updateScoresTransaction(transaction, roundId, {
                scores: newRoundScores,
                scoresProgress: newRoundProgress
            })
        } else {
            // The challenger succeeded in its challenge
            const reward = round.rewardsPerQuestion + (numCorrect > bet) * round.rewardsForBonus
            await this.roundScoreRepo.increaseRoundTeamScoreTransaction(transaction, teamId, reward)
    
            for (const challenger of challengers) {
                await this.playerRepo.updatePlayerStatusTransaction(transaction, challenger.id, PlayerStatus.CORRECT)
            }

            await this.gameQuestionRepo.updateQuestionWinnerTransaction(transaction, questionId, {
                playerId,
                teamId
            })
        }

        await super.endQuestionTransaction(transaction, questionId)

        console.log("Enumeration question successfully ended", questionId)
    }

    /* ============================================================================================================ */

    async addBet(questionId, playerId, teamId, bet) {
        if (!questionId) {
            throw new Error("No question ID has been provided!");
        }

        if (!playerId) {
            throw new Error("No player ID has been provided!");
        }
        
        if (!teamId) {
            throw new Error("No team ID has been provided!");
        }

        if (bet < 0) {
            throw new Error("The bet must be positive!");
        }

        try {
            await runTransaction(firestore, async (transaction) => {
                await this.soundRepo.addSoundTransaction(transaction, 'pop')
                await this.gameQuestionRepo.addBetTransaction(transaction, questionId, playerId, teamId, bet)
            })
        }
        catch (error) {
            console.error("There was an error adding the bet:", error);
            throw error;
        }
    }

    async endReflection(questionId) {
        if (!questionId) {
            throw new Error("No question ID has been provided!");
        }

        try {
            await runTransaction(firestore, transaction => this.endReflectionTransaction(transaction, questionId))
        }
        catch (error) {
            console.error("There was an error ending the enum reflection:", error);
            throw error;
        }
    }

    async endReflectionTransaction(transaction, questionId) {
        const players = await this.playerRepo.getPlayersTransaction(transaction, questionId)

        /* No player made a bet */
        if (players.bets.length === 0) {
            await this.endQuestionTransaction(transaction, questionId)
        } else {
            const baseQuestion = await this.baseQuestionRepo.getQuestionTransaction(transaction, questionId)
    
            // Calculate the 'challenger' of this question (the best player)
            const [playerId, teamId, bet] = GameEnumerationQuestion.findHighestBidder(players.bets)
            await this.gameQuestionRepo.updatePlayersTransaction(transaction, questionId, {
                challenger: {
                    playerId,
                    teamId,
                    bet,
                    numCorrect: 0,
                    cited: {}
                }
            })
    
            await this.playerRepo.updatePlayerStatusTransaction(transaction, playerId, PlayerStatus.FOCUS)
    
            await this.gameQuestionRepo.updateQuestionTransaction(transaction, questionId, {
                status: EnumerationQuestionStatus.CHALLENGE
            })

            await this.timerRepo.updateTimerTransaction(transaction, {
                duration: baseQuestion.challengeTime,
                status: TimerStatus.RESET,
            })
        }
    }

    async validateItem(questionId, itemIdx) {
        if (!questionId) {
            throw new Error("No question ID has been provided!");
        }
        if (itemIdx < 0) {
            throw new Error("The item index must be positive!");
        }

        try {
            await runTransaction(firestore, async (transaction) => {
                await this.soundRepo.addSoundTransaction(transaction, 'super_mario_world_coin')
                await this.gameQuestionRepo.validateItemTransaction(transaction, questionId, itemIdx)

                console.log("Item validated successfully", questionId, itemIdx)
            })
        }
        catch (error) {
            console.error("There was an error validating the item:", error);
            throw error;
        }
    }


    async incrementValidItems(questionId, organizerId) {
        if (!questionId) {
            throw new Error("No question ID has been provided!");
        }
        if (!organizerId) {
            throw new Error("No organizer ID has been provided!");
        }

        try {
            await runTransaction(firestore, async (transaction) => {
                await this.soundRepo.addSoundTransaction(transaction, 'super_mario_world_coin')
                await this.gameQuestionRepo.incrementValidItemsTransaction(transaction, questionId)

                console.log("Valid items incremented successfully", questionId, organizerId)
            })
        }
        catch (error) {
            console.error("There was an error incrementing the valid items:", error);
            throw error;
        }
    }

}