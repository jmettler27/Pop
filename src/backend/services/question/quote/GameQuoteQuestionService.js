import { QuoteQuestion } from "@/backend/models/questions/Quote";
import GameQuestionService from "@/backend/services/question/GameQuestionService";
import { serverTimestamp } from "firebase/firestore";

export default class GameQuoteQuestionService extends GameQuestionService {

    constructor(gameId, roundId) {
        super(gameId, roundId, QuestionType.QUOTE);
    }


    async resetQuestionTransaction(transaction, questionId) {
        await this.gameQuestionRepo.resetPlayersTransaction(transaction, questionId);

        await this.playerRepo.updateAllPlayersStatusesTransaction(transaction, PlayerStatus.IDLE)

        await super.resetQuestionTransaction(transaction, questionId);

        console.log('Resetted question', questionId)
    }
    
    async endQuestionTransaction(transaction, questionId) {
        await super.endQuestionTransaction(transaction, questionId);

        await this.gameQuestionRepo.clearBuzzedPlayers(transaction, questionId);

        console.log('Ended question', questionId)
    }

    async handleCountdownEndTransaction(transaction, questionId) {
        await super.handleCountdownEndTransaction(transaction, questionId);

        await this.gameQuestionRepo.clearBuzzedPlayers(transaction, questionId);

        console.log('Ended question countdown', questionId)
    }

    /* ============================================================================================================ */

    async clearBuzzer(questionId) {
        if (!questionId) {
            throw new Error("Missing question ID!");
        }

        try {
            await runTransaction(async (transaction) => {
                const players = await this.gameQuestionRepo.getPlayersTransaction(transaction, questionId);

                for (const playerId of players.buzzed) {
                    await this.playerRepo.updatePlayerStatusTransaction(transaction, playerId, PlayerStatus.IDLE);
                }
                await this.gameQuestionRepo.clearBuzzerTransaction(transaction, questionId);
                await this.timerRepo.resetTimerTransaction(transaction);
                await this.soundRepo.addSoundTransaction(transaction, 'robinet_desert');

                console.log("Buzzer successfully cleared", questionId);
            });
        } catch (error) {
            console.error("Error clearing buzzer:", error);
            throw error;
        }
    }

    async revealQuoteElement(questionId, quoteElem, quotePartIdx = null, wholeTeam = false) {
        if (!questionId) {
            throw new Error("No question ID has been provided!");
        }
        if (!QuoteQuestion.ELEMENTS.includes(quoteElem)) {
            throw new Error("The quote element is not valid!");
        }
        if (quoteElem === 'quote' && quotePartIdx === null) {
            throw new Error("The quote part index is not valid!");
        }
        try {
            await runTransaction(firestore, async (transaction) => {
                const baseQuestion = await this.baseQuestionRepo.getQuestionTransaction(transaction, questionId);
                const round = await this.roundRepo.getRoundTransaction(transaction, baseQuestion.roundId);
                const gameQuestion = await this.gameQuestionRepo.getQuestionTransaction(transaction, questionId);
                const questionPlayers = await this.gameQuestionRepo.getPlayersTransaction(transaction, questionId);

                const playerId = questionPlayers.buzzed[0] || null
            
                const newRevealed = gameQuestion.revealed
                if (quoteElem === 'quote') {
                    newRevealed[quoteElem][quotePartIdx] = {
                        revealedAt: serverTimestamp(),
                        playerId,
                    }
                } else {
                    newRevealed[quoteElem] = {
                        revealedAt: serverTimestamp(),
                        playerId,
                    }
                }
            
                /* Update the winner team scores */
                if (playerId) {
                    const player = await this.playerRepo.getPlayerTransaction(transaction, playerId);
                    const teamId = player.teamId
                    const points = round.rewardsPerElement

                    await this.roundScoreRepo.increaseTeamScoreTransaction(transaction, gameId, roundId, questionId, teamId, points)
                    await this.playerRepo.updatePlayerStatusTransaction(transaction, playerId, PlayerStatus.CORRECT)
                }
            
                const toGuess = baseQuestion.toGuess
                const quoteParts = baseQuestion.quoteParts
            
                const temp1 = toGuess.every(elem => newRevealed[elem] && !isObjectEmpty(newRevealed[elem]))
                const newRevealedQuote = newRevealed['quote']
                const temp2 = quoteParts.every((_, idx) => newRevealedQuote[idx] && !isObjectEmpty(newRevealedQuote[idx]))
                const allRevealed = temp1 && temp2
            
                await this.gameQuestionRepo.updateQuestionTransaction(transaction, questionId, {
                    revealed: newRevealed
                })
            
                // If all revealed
                if (allRevealed) {
                    await this.soundRepo.addSoundTransaction(transaction, gameId, 'Anime wow')
                    await this.endQuestionTransaction(transaction, questionId)
                    console.log('All revealed')
                    return
                }
                await this.soundRepo.addSoundTransaction(transaction, gameId, playerId ? 'super_mario_world_coin' : 'cartoon_mystery_musical_tone_002')
                
                console.log('Revealed quote element', quoteElem, quotePartIdx)
            });
        } catch (error) {
            console.error("There was an error revealing the quote element", error);
            throw error;
        }
    }

    async validateAllQuoteElements(questionId, playerId) {
        if (!questionId) {
            throw new Error("No question ID has been provided!");
        }
        if (!playerId) {
            throw new Error("No player ID has been provided!");
        }
        try {
            await runTransaction(firestore, async (transaction) => {
                const baseQuestion = await this.baseQuestionRepo.getQuestionTransaction(transaction, questionId);
                const round = await this.roundRepo.getRoundTransaction(transaction, baseQuestion.roundId);
                const gameQuestion = await this.gameQuestionRepo.getQuestionTransaction(transaction, questionId);
                const player = await this.playerRepo.getPlayerTransaction(transaction, playerId);

                const newRevealed = gameQuestion.revealed
                const toGuess = baseQuestion.toGuess
                const quoteParts = baseQuestion.quoteParts
                
                const timestamp = serverTimestamp();
                for (const quoteElem of toGuess) {
                    if (quoteElem === 'quote') {
                        for (let i = 0; i < quoteParts.length; i++) {
                            newRevealed[quoteElem][i] = {
                                revealedAt: timestamp,
                                playerId,
                            }
                        }
                    } else {
                        newRevealed[quoteElem] = {
                            revealedAt: timestamp,
                            playerId,
                        }
                    }
                }
            
                /* Update the winner team scores */
                const teamId = player.teamId
                const rewardsPerElement = round.rewardsPerElement
                const multiplier = toGuess.length + toGuess.includes('quote') * (quoteParts.length - 1);
                const points = rewardsPerElement * multiplier;
                await this.roundScoreRepo.increaseTeamScoreTransaction(transaction, gameId, roundId, questionId, teamId, points)
            
                await this.playerRepo.updatePlayerStatusTransaction(transaction, playerId, PlayerStatus.CORRECT)
            
                await this.gameQuestionRepo.updateQuestionTransaction(transaction, questionId, {
                    revealed: newRevealed,
                })
            
                await this.soundRepo.addSoundTransaction(transaction, gameId, 'Anime wow')
                await this.endQuestionTransaction(transaction, questionId)

                console.log("All quote elements validated")
            });
        } catch (error) {
            console.error("There was an error validating the quote element", error);
            throw error;
        }
    }

    async cancelPlayer(questionId, playerId, wholeTeam = false) {
        if (!questionId) {
            throw new Error("No question ID has been provided!");
        }
    
        try {
            await runTransaction(firestore, async (transaction) => {
                await this.gameQuestionRepo.cancelPlayerTransaction(transaction, questionId, playerId)
                await this.playerRepo.updatePlayerStatusTransaction(transaction, playerId, PlayerStatus.WRONG)
                await this.soundRepo.addSoundTransaction(transaction, gameId, 'cartoon_mystery_musical_tone_002')
                // this.timerRepo.updateTimerStateTransaction(transaction, gameId, TimerStatus.RESET)

                console.log(`Player ${playerId} was canceled successfully.`);
            });
        } catch (error) {
            console.error("There was an error adding a canceled player:", error);
            throw error;
        }
    }
    
}