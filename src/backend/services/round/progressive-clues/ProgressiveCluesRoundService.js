import BuzzerRoundService from "@/backend/services/round/buzzer/BuzzerRoundService";
import {RoundType} from "@/backend/models/rounds/RoundType";

export default class ProgressiveCluesRoundService extends BuzzerRoundService {

    constructor(gameId) {
        super(gameId, RoundType.PROGRESSIVE_CLUES);

        // this.baseQuestionRepo = new BaseProgressiveCluesQuestionRepository();
    }

    async calculateMaxPointsTransaction(transaction, round) {
        return round.questions.length * (round.rewardsPerQuestion + round.rewardsForBonus)
    }

}
