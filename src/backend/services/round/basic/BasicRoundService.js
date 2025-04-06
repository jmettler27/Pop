import { TimerStatus } from "@/backend/models/Timer";
import GameBasicQuestionRepository from "@/backend/repositories/question/game/GameBasicQuestionRepository";
import RoundService from "@/backend/services/round/RoundService";

export default class BasicRoundService extends RoundService {

    constructor(gameId, roundId) {
        super(gameId, roundId)
    }

    async calculateMaxPointsTransaction(transaction, round) {
        return round.questions.length * (round.rewardsPerQuestion + round.rewardsForBonus)
    }

    async getRound() {
        const round = await this.roundRepo.getRound(this.roundId)
        return round
    }

    async prepareQuestionStartTransaction(transaction, questionId, questionOrder) {
        const gameQuestion = await this.gameQuestionRepo.getQuestionTransaction(transaction, questionId)
        const playerIds = await this.playerRepo.getAllIdsTransaction(transaction)

        for (const id of playerIds) {
            await this.playerRepo.updatePlayerStatusTransaction(transaction, id, PlayerStatus.IDLE)
        }

        await this.timerRepo.updateTimerTransaction(transaction, { status: TimerStatus.RESET, duration: gameQuestion.thinkingTime })
        await this.soundRepo.addSoundTransaction(transaction, 'skyrim_skill_increase')

        const gameQuestionRepo = new GameBasicQuestionRepository(this.gameId, this.roundId)
        await gameQuestionRepo.startQuestionTransaction(transaction, questionId)
    }
    
}
