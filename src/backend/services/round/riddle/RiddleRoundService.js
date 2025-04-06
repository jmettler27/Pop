import RoundService from '@/backend/services/round/RoundService';

import { firestore } from '@/backend/firebase/firebase'
import { runTransaction } from 'firebase/firestore'

import { PlayerStatus } from '@/backend/models/users/Player';
import { TimerStatus } from '@/backend/models/Timer';
import GameQuestionRepositoryFactory from '@/backend/repositories/question/game/GameQuestionRepositoryFactory';


export default class RiddleRoundService extends RoundService {

    constructor(gameId, roundId, questionType) {
        super(gameId, roundId, questionType);
    }

    async resetQuestionTransaction(transaction, questionId) {
        await this.gameQuestionRepo.resetPlayersTransaction(transaction, questionId);
        await this.gameQuestionRepo.updateQuestionWinnerTransaction(transaction, questionId, null);

        await super.resetQuestionTransaction(transaction, questionId);
        
        console.log("Riddle question successfully reset", questionId);
    }

    async endQuestionTransaction(transaction, questionId) {
        await super.endQuestionTransaction(transaction, questionId);

        console.log("Riddle question successfully ended", questionId);
    }

    async handleCountdownEndTransaction(transaction, questionId) {
        await super.handleCountdownEndTransaction(transaction, questionId);

        const players = await this.gameQuestionRepo.getPlayersTransaction(transaction, questionId);
        const { buzzed } = players;

        if (buzzed.length === 0) {
            await this.timerRepo.resetTimerTransaction(transaction);
        } else {
            await this.invalidateAnswerTransaction(transaction, questionId, buzzed[0]);
        }

        console.log("Riddle question countdown end successfully handled", questionId);
    }

    async calculateMaxPointsTransaction(transaction, round) {
        return round.questions.length * (round.rewardsPerQuestion + round.rewardsForBonus)
    }

    async prepareQuestionStartTransaction(transaction, questionId, questionOrder) {
        const gameQuestion = await this.gameQuestionRepo.getQuestionTransaction(transaction, questionId)
        const playerIds = await this.playerRepo.getAllIdsTransaction(transaction)

        for (const id of playerIds) {
            await this.playerRepo.updatePlayerStatusTransaction(transaction, id, PlayerStatus.IDLE)
        }

        await this.timerRepo.updateTimerTransaction(transaction, { status: TimerStatus.RESET, duration: gameQuestion.thinkingTime })
        await this.soundRepo.addSoundTransaction(transaction, 'skyrim_skill_increase')

        const gameQuestionRepo = GameQuestionRepositoryFactory.createRepository(this.questionType, this.gameId, this.roundId)
        await gameQuestionRepo.startQuestionTransaction(transaction, questionId)
    }

    /* ============================================================================================================ */
    
    async handleBuzzerHeadChanged(playerId) {
        if (!playerId) {
            throw new Error("No player ID has been provided!");
        }

        await runTransaction(firestore, async (transaction) => {
            await this.playerRepo.updateStatusTransaction(transaction, playerId, PlayerStatus.FOCUS);

            console.log("Buzzer head changed event successfully handled", playerId);
        });
    }

    async validateAnswer(questionId, playerId) {
        if (!questionId) {
            throw new Error("Missing question ID!");
        }
        if (!playerId) {
            throw new Error("Missing player ID!");
        }

        try {
            await runTransaction(firestore, async (transaction) => {
                const player = await this.playerRepo.getPlayerTransaction(transaction, playerId);
                const round = await this.roundRepo.getRoundTransaction(transaction, this.roundId);
                
                const teamId = player.teamId;
                const points = round.rewardsPerQuestion;

                await this.roundScoreRepo.increaseRoundTeamScoreTransaction(transaction, questionId, teamId, points);
                await this.playerRepo.updateStatusTransaction(transaction, playerId, PlayerStatus.CORRECT);
                await this.gameQuestionRepo.updateQuestionWinnerTransaction(transaction, questionId, { playerId, teamId });
                await this.soundRepo.addSoundTransaction(transaction, 'Anime wow');
                await this.endQuestionTransaction(transaction, questionId);

                console.log("Answer successfully validated", questionId, playerId);
            });
        } catch (error) {
            console.error("Error validating answer:", error);
            throw error;
        }
    }

    async invalidateAnswer(questionId, playerId) {
        if (!questionId) {
            throw new Error("Missing question ID!");
        }
        if (!playerId) {
            throw new Error("Missing player ID!");
        }

        try {
            await runTransaction(async (transaction) => {
                const gameQuestion = await this.gameQuestionRepo.getQuestionTransaction(transaction, questionId);
                const clueIdx = gameQuestion.currentClueIdx || 0;

                await this.gameQuestionRepo.cancelPlayerTransaction(transaction, questionId, playerId, clueIdx);
                await this.playerRepo.updatePlayerStatusTransaction(transaction, playerId, PlayerStatus.WRONG);
                await this.soundRepo.addWrongAnswerSoundToQueueTransaction(transaction, this.gameId);
                // await this.timerRepo.updateTimerStateTransaction(transaction, this.gameId, TimerStatus.RESET);

                console.log("Answer successfully invalidated", questionId, playerId);
            });
        } catch (error) {
            console.error("Error invalidating answer:", error);
            throw error;
        }
    }

    async addPlayerToBuzzer(questionId, playerId) {
        if (!questionId) {
            throw new Error("Missing question ID!");
        }
        if (!playerId) {
            throw new Error("Missing player ID!");
        }

        try {
            await runTransaction(async (transaction) => {
                await this.gameQuestionRepo.addPlayerToBuzzerTransaction(transaction, questionId, playerId);
                await this.soundRepo.addSoundTransaction(transaction, 'sfx-menu-validate');

                console.log("Player successfully added to buzzer", questionId, playerId);
            });
        } catch (error) {
            console.error("Error adding player to buzzer:", error);
            throw error;
        }
    }

    async removePlayerFromBuzzer(questionId, playerId) {
        if (!questionId) {
            throw new Error("Missing question ID!");
        }
        if (!playerId) {
            throw new Error("Missing player ID!");
        }

        try {
            await runTransaction(async (transaction) => {
                await this.gameQuestionRepo.removePlayerFromBuzzerTransaction(transaction, questionId, playerId);
                await this.playerRepo.updatePlayerStatusTransaction(transaction, playerId, PlayerStatus.IDLE);
                await this.soundRepo.addSoundTransaction(transaction, 'JPP_de_lair');

                console.log("Player successfully removed from buzzer", questionId, playerId);
            });
        } catch (error) {
            console.error("Error removing player from buzzer:", error);
            throw error;
        }
    }

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
                await this.timerRepo.updateTimerStateTransaction(transaction, TimerStatus.RESET);
                await this.soundRepo.addSoundTransaction(transaction, 'robinet_desert');

                console.log("Buzzer successfully cleared", questionId);
            });
        } catch (error) {
            console.error("Error clearing buzzer:", error);
            throw error;
        }
    }
}

