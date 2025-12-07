import RoundService from "@/backend/services/round/RoundService";

export default class ProgressiveCluesRoundService extends RoundService {

    constructor(gameId, roundId) {
        super(gameId, roundId)
    }

    async calculateMaxPointsTransaction(transaction, round) {
        return round.questions.length * (round.rewardsPerQuestion + round.rewardsForBonus)
    }

}
