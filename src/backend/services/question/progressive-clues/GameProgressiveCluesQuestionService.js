import GameRiddleQuestionService from "@/backend/services/round/riddle/RiddleRoundService";

import { firestore } from '@/backend/firebase/firebase'
import { runTransaction } from 'firebase/firestore'

import { PlayerStatus } from '@/backend/models/users/Player';


export default class GameProgressiveCluesQuestionService extends GameRiddleQuestionService {

    constructor(gameId, roundId) {
        super(gameId, roundId);
    }

    async resetQuestionTransaction(transaction, questionId) {
        await super.resetQuestionTransaction(transaction, questionId);

        await this.gameQuestionRepo.updateQuestionTransaction(transaction, questionId, {
            currentClueIdx: -1
        });

        console.log("Progressive clues question successfully reset", questionId);
    }

    /* ====================================================================================================== */

    async revealProgressiveClues(questionId) {
        if (!questionId) {
            throw new Error("No question ID has been provided!");
        }

        try {
            await runTransaction(firestore, async (transaction) => {

                const players = await this.gameQuestionRepo.getPlayersTransaction(transaction, questionId)
                const buzzed = players.buzzed
                const canceled = players.canceled

                const gameQuestion = await this.gameQuestionRepo.getQuestionTransaction(transaction, questionId)
                const round = await this.roundRepo.getRoundTransaction(transaction, roundId)

                // If there is a buzzed player, update his status to idle
                if (buzzed && buzzed.length > 0) {
                    await this.playerRepo.updatePlayerStatusTransaction(transaction, buzzed[0], PlayerStatus.IDLE)
                    await this.gameQuestionRepo.updatePlayersTransaction(transaction, questionId, {
                        buzzed: []
                    })
                }
                await this.gameQuestionRepo.incrementQuestionCurrentClueIdxTransaction(transaction, questionId)
            
                // Decancel players who need it
                if (canceled?.length > 0) {
                    const targetClueIdx = gameQuestion.currentClueIdx + 1 - round.delay
                    canceled
                        .filter(cancellation => cancellation.clueIdx === targetClueIdx)
                        .forEach(cancellation => {
                            this.playerRepo.updatePlayerStatusTransaction(transaction, cancellation.playerId, PlayerStatus.IDLE)
                        });
                }
                // await this.timerRepo.updateTimerStateTransaction(transaction, gameId, TimerStatus.RESET)
                await this.soundRepo.addSoundTransaction(transaction, 'cartoon_mystery_musical_tone_002')

                console.log("Progressive clues revealed successfully", questionId);
            })
        }

        catch (error) {
            console.error("There was an error revealing the progressive clues", error);
            throw error;
        }
    }
    
}
