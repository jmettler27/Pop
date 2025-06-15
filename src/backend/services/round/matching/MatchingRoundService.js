import { TimerStatus } from "@/backend/models/Timer";
import { PlayerStatus } from "@/backend/models/users/Player";

import GameMatchingQuestionRepository from "@/backend/repositories/question/game/GameMatchingQuestionRepository";

import RoundService from "@/backend/services/round/RoundService";


export default class MatchingRoundService extends RoundService {

    constructor(gameId, roundId) {
        super(gameId, roundId)
    }

    async calculateMaxPointsTransaction(transaction, round) {
        return round.questions.length * (round.rewardsPerQuestion + round.rewardsForBonus)
    }

    async prepareQuestionStartTransaction(transaction, questionId, questionOrder) {
        const baseQuestion = await this.baseQuestionRepo.getQuestionTransaction(transaction, questionId)
        const gameQuestion = await this.gameQuestionRepo.getQuestionTransaction(transaction, questionId)

        const chooser = await this.chooserRepo.getChooserTransaction(transaction)
        const newChooserIdx = 0
        const newChooserTeamId = chooser.chooserOrder[newChooserIdx]

        const choosers = await this.playerRepo.getPlayersByTeamIdTransaction(transaction, newChooserTeamId)
        const nonChoosers = await this.playerRepo.getAllOtherPlayersTransaction(transaction, newChooserTeamId)

        await this.chooserRepo.updateChooserTransaction(transaction, {
            chooserIdx: newChooserIdx
        })
        for (const player of choosers) {
            await this.playerRepo.updatePlayerStatusTransaction(transaction, player.id, PlayerStatus.FOCUS)
        }
        for (const player of nonChoosers) {
            await this.playerRepo.updatePlayerStatusTransaction(transaction, player.id, PlayerStatus.IDLE)
        }
        
        await this.timerRepo.resetTimerTransaction(transaction, gameQuestion.thinkingTime * (baseQuestion.numCols - 1))

        const gameQuestionRepo = new GameMatchingQuestionRepository(this.gameId, this.roundId)
        await gameQuestionRepo.startQuestionTransaction(transaction, questionId)
    }

}
