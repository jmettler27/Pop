import GameQuestionService from "@/backend/services/question/GameQuestionService";

import ChooserRepository from "@/backend/repositories/user/ChooserRepository";

import { QuestionType } from "@/backend/models/questions/QuestionType";
import { ScorePolicyType } from "@/backend/models/ScorePolicy";
import { NaguiQuestion } from "@/backend/models/questions/Nagui";

import { serverTimestamp } from "firebase/firestore";
import { PlayerStatus } from "@/backend/models/users/Player";


export default class GameNaguiQuestionService extends GameQuestionService {

    constructor(gameId, roundId) {
        super(gameId, roundId, QuestionType.NAGUI);

        this.chooserRepo = new ChooserRepository(gameId);
    }
    
    async resetQuestionTransaction(transaction, questionId) {

        await this.gameQuestionRepo.updateQuestionTransaction(transaction, questionId, {
            playerId: null,
            teamId: null,
            option: null,
            reward: null,
            correct: null
        })

        await super.resetQuestionTransaction(transaction, questionId);

        console.log('Resetted question', questionId)
    }

    async handleCountdownEndTransaction(transaction, questionId) {
        const gameQuestion = await this.gameQuestionRepo.getQuestionTransaction(transaction)
        const teamId = gameQuestion.teamId

        const choosers = await this.playerRepo.getPlayersByTeamIdTransaction(transaction, teamId)
    
        const choiceIdx = null
        const correct = false
        const reward = 0
        await this.roundScoreRepo.increaseTeamScoreTransaction(transaction, questionId, teamId, reward)
        await this.gameQuestionRepo.updateQuestionTransaction(transaction, questionId, { playerId, choiceIdx, reward, correct, })
    
        for (const chooser of choosers) {
            await this.playerRepo.updatePlayerStatusTransaction(transaction, chooser.id, PlayerStatus.READY)
        }
        await this.soundRepo.addSoundTransaction(transaction, 'hysterical5')
        await this.endQuestionTransaction(transaction, questionId)



        console.log('Ended question countdown', questionId)
    }
    
    async endQuestionTransaction(transaction, questionId) {
        await super.endQuestionTransaction(transaction, questionId);

        // await this.gameQuestionRepo.clearBuzzedPlayers(transaction, questionId);

        console.log('Ended question', questionId)
    }

    /* ============================================================================================================ */

    async selectOption(questionId, playerId, optionIdx) {
        if (!questionId) {
            throw new Error('No question ID has been provided!');
        }
        if (!playerId) {
            throw new Error('No player ID has been provided!');
        }
        if (optionIdx < 0 || optionIdx >= NaguiQuestion.MAX_NUM_OPTIONS) {
            throw new Error('Invalid option index!');
        }

        try {
            await runTransaction(firestore, async (transaction) => {
                const option = NaguiQuestion.OPTIONS[optionIdx]

                await this.gameQuestionRepo.updateQuestionTransaction(transaction, questionId, { playerId, option })
                await this.soundRepo.addSoundTransaction(transaction, NAGUI_OPTION_TO_SOUND[option])

                console.log('Selected Nagui option', questionId, optionIdx)
            })
        } catch (error) {
            console.error('Error selecting Nagui option:', error);
            throw error;
        }
    }

    async selectChoice(questionId, playerId, teamId, choiceIdx) {
        if (!questionId) {
            throw new Error('No question ID has been provided!');
        }
        if (!playerId) {
            throw new Error('No player ID has been provided!');
        }
        if (!teamId) {
            throw new Error('No team ID has been provided!');
        }
        if (choiceIdx < 0 || choiceIdx >= NaguiQuestion.MAX_NUM_CHOICES) {
            throw new Error('Invalid choice index!');
        }

        try {
            await runTransaction(firestore, async (transaction) => {
                
                const choosers = await this.playerRepo.getPlayersByTeamIdTransaction(transaction, teamId)
                const baseQuestion = await this.baseQuestionRepo.getQuestionTransaction(transaction, questionId)
                const round = await this.roundRepo.getRoundTransaction(transaction, this.roundId)
                const gameQuestion = await this.gameQuestionRepo.getQuestionTransaction(transaction, questionId)
                
                const correct = baseQuestion.isValidAnswer(choiceIdx)
                const reward = correct ? round.rewardsPerQuestion[gameQuestion.option] : 0;
                await this.roundScoreRepo.increaseTeamScoreTransaction(transaction, questionId, teamId, reward)
            
                for (const chooser of choosers) {
                    await this.playerRepo.updatePlayerStatusTransaction(transaction, chooser.id, PlayerStatus.READY)
                }

                await this.gameQuestionRepo.updateQuestionTransaction(transaction, questionId, { playerId, choiceIdx, reward, correct, })
                await this.soundRepo.addSoundTransaction(transaction, correct ? 'Anime wow' : 'hysterical5')
                await this.endQuestionTransaction(transaction, questionId)


                console.log('Selected Nagui choice', questionId, choiceIdx)
            })
        } catch (error) {
            console.error('Error selecting Nagui choice:', error);
            throw error;
        }
    }

    async handleHideAnswer(questionId, playerId, teamId, correct) {
        if (!questionId) {
            throw new Error('No question ID has been provided!');
        }
        if (!playerId) {
            throw new Error('No player ID has been provided!');
        }
        if (!teamId) {
            throw new Error('No team ID has been provided!');
        }
        if (correct !== true && correct !== false) {
            throw new Error('Invalid correct value!');
        }

        try {
            await runTransaction(firestore, async (transaction) => {

                const choosers = await this.playerRepo.getPlayersByTeamIdTransaction(transaction, teamId)
                const round = await this.roundRepo.getRoundTransaction(transaction, this.roundId)
                const gameQuestion = await this.gameQuestionRepo.getQuestionTransaction(transaction, questionId)
            
                const reward = correct ? round.rewardsPerQuestion[gameQuestion.option] : 0
                await this.roundScoreRepo.increaseTeamScoreTransaction(transaction, questionId, teamId, reward)
                await this.gameQuestionRepo.updateQuestionTransaction(transaction, questionId, { playerId, reward, correct, })
            
                for (const chooser of choosers) {
                    await this.playerRepo.updatePlayerStatusTransaction(transaction, chooser.id, PlayerStatus.READY)
                }

                await this.soundRepo.addSoundTransaction(transaction, correct ? 'Anime wow' : 'hysterical5')
                await this.endQuestionTransaction(transaction, questionId)

                console.log('Handled answer to hidden Nagui option', questionId, playerId, teamId, correct)
            })
        } catch (error) {
            console.error('Error handling answer to hidden Nagui option:', error);
            throw error;
        }
    }
}