import { TimerStatus } from "@/backend/models/Timer";

import GameEnumerationQuestionRepository from "@/backend/repositories/question/game/GameEnumerationQuestionRepository";
import RoundService from "@/backend/services/round/RoundService";


export default class EnumerationRoundService extends RoundService {

    constructor(gameId, roundId) {
        super(gameId, roundId)
    }

    async calculateMaxPointsTransaction(transaction, round) {
        return round.questions.length * (round.rewardsPerQuestion + round.rewardsForBonus)
    }

    async prepareQuestionStartTransaction(transaction, questionId, questionOrder) {
        const baseQuestion = await this.baseQuestionRepo.getQuestionTransaction(transaction, questionId)
        const playerIds = await this.playerRepo.getAllIdsTransaction(transaction)
    
        for (const id of playerIds) {
            await this.playerRepo.updatePlayerStatusTransaction(transaction, id, PlayerStatus.IDLE)
        }
        
        await this.timerRepo.updateTimerTransaction(transaction, { status: TimerStatus.RESET, duration: baseQuestion.thinkingTime })
        await this.soundRepo.addSoundTransaction(transaction, 'skyrim_skill_increase')

        const gameQuestionRepo = new GameEnumerationQuestionRepository(this.gameId, this.roundId)
        await gameQuestionRepo.startQuestionTransaction(transaction, questionId)
    }

}
