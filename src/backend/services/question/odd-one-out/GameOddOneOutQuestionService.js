 import GameQuestionService from "@/backend/services/question/GameQuestionService";

import ChooserRepository from "@/backend/repositories/user/ChooserRepository";

import { QuestionType } from "@/backend/models/questions/QuestionType";
import { ScorePolicyType } from "@/backend/models/ScorePolicy";
import { OddOneOutQuestion } from "@/backend/models/questions/OddOneOut";

import { serverTimestamp } from "firebase/firestore";
import { TimerStatus } from "@/backend/models/Timer";
import { PlayerStatus } from "@/backend/models/users/Player";


export default class GameOddOneOutQuestionService extends GameQuestionService {

    constructor(gameId, roundId) {
        super(gameId, roundId, QuestionType.ODD_ONE_OUT);

        this.chooserRepo = new ChooserRepository(gameId);
    }
    
    async resetQuestionTransaction(transaction, questionId) {

        await this.chooserRepo.resetChooserTransaction(transaction);
        await this.gameQuestionRepo.updateQuestionTransaction(transaction, questionId, {
            winner: null,
            selectedItems: [],
        })

        await super.resetQuestionTransaction(transaction, questionId);

        console.log('Resetted question', questionId)
    }

    async handleCountdownEndTransaction(transaction, questionId) {
        const gameQuestion = await this.gameQuestionRepo.getQuestionTransaction(transaction);
    
        const selectedIdxsSet = new Set(gameQuestion.selectedItems.map(item => item.idx));
        const remainingItems = [];
        for (let i = 0; i < OddOneOutQuestion.MAX_NUM_ITEMS; i++) {
            if (!selectedIdxsSet.has(i)) {
                remainingItems.push(i);
            }
        }
    
        const randomIdx = remainingItems[Math.floor(Math.random() * remainingItems.length)];
        await this.selectProposalTransaction(transaction, questionId, 'system', randomIdx)

        console.log('Ended question countdown', questionId)
    }
    
    async endQuestionTransaction(transaction, questionId) {
        await super.endQuestionTransaction(transaction, questionId);

        // await this.gameQuestionRepo.clearBuzzedPlayers(transaction, questionId);

        console.log('Ended question', questionId)
    }

    /* ============================================================================================================ */

    /**
     * Select a proposal in an Odd One Out question
     * @param {string} questionId - ID of the question
     * @param {string} playerId - ID of the player
     * @param {number} idx - Index of the selected proposal
     * @returns {Promise<void>}
     */
    async selectProposal(questionId, playerId, idx) {
        if (!questionId) {
            throw new Error('No question ID has been provided!');
        }
        if (!playerId) {
            throw new Error('No player ID has been provided!');
        }
        if (idx < 0 || idx >= OddOneOutQuestion.MAX_NUM_ITEMS) {
            throw new Error('Invalid proposal index!');
        }


        await runTransaction(firestore, async (transaction) => {
            const gameQuestion = await this.gameQuestionRepo.getQuestionTransaction(transaction);
            const { chooserOrder, chooserIdx } = await this.chooserRepo.getChooserTransaction(transaction);

            const teamId = chooserOrder[chooserIdx];
            const teamPlayers = await this.playerRepo.getPlayersByTeamIdTransaction(transaction, teamId);

            if (idx === gameQuestion.answerIdx) {
                // The selected proposal is the odd one out
                const roundScorePolicy = game.roundScorePolicy;
                const mistakePenalty = round.mistakePenalty;

                if (roundScorePolicy === ScorePolicyType.RANKING) {
                    await this.roundScoreRepo.increaseTeamScoreTransaction(transaction, questionId, teamId, mistakePenalty);
                } else if (roundScorePolicy === ScorePolicyType.COMPLETION_RATE) {
                    await this.roundScoreRepo.decreaseGlobalTeamScoreTransaction(transaction, this.roundId, questionId, mistakePenalty, teamId);
                }

                // Update player statuses
                for (const player of teamPlayers) {
                    await this.playerRepo.updatePlayerStatusTransaction(transaction, player.id, PlayerStatus.WRONG);
                }

                // Move winner to head of chooser list
                const newChooserOrder = moveToHead(teamId, chooserOrder);
                await this.chooserRepo.updateChooserOrderTransaction(transaction, newChooserOrder);

                // Update question winner and end question
                await this.updateQuestionWinnerTransaction(transaction, questionId, playerId, teamId);
                await this.soundRepo.addSoundTransaction(transaction, 'hysterical5');
                await this.endQuestionTransaction(transaction, questionId);
            } else {
                // The selected proposal is correct
                const newNumClicked = gameQuestion.selectedItems.length + 1;

                if (newNumClicked === gameQuestion.items.length - 1) {
                    // No one selected the odd one out
                    await this.soundRepo.addSoundTransaction(transaction, 'zelda_secret_door');
                    await this.endQuestionTransaction(transaction, questionId);
                } else {
                    // The selected proposal is not the last remaining one
                    await this.chooserRepo.switchChooserTransaction(transaction);
                    await this.soundRepo.addSoundTransaction(transaction, 'Bien');
                    await this.timerRepo.resetTimerTransaction(transaction);
                }

                // Update player statuses
                for (const player of teamPlayers) {
                    await this.playerRepo.updatePlayerStatusTransaction(transaction, player.id, PlayerStatus.IDLE);
                }
            }

            // Update selected items and timer
            await this.gameQuestionRepo.updateQuestionTransaction(transaction, questionId, 
                {
                    selectedItems: [...gameQuestion.selectedItems, {
                        idx,
                        playerId,
                        timestamp: serverTimestamp()
                    }],
                }
            )
            await this.timerRepo.resetTimerTransaction(transaction);
        })
    }

}
