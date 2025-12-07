import RiddleRoundService from "@/backend/services/round/riddle/RiddleRoundService";

export default class BlindtestRoundService extends RiddleRoundService {

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

}
