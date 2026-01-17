import BuzzerRoundService from "@/backend/services/round/buzzer/BuzzerRoundService";
import {DEFAULT_THINKING_TIME_SECONDS} from "@/backend/utils/question/question";
import {QuestionType} from "@/backend/models/questions/QuestionType";
import {PlayerStatus} from "@/backend/models/users/Player";

export default class BlindtestRoundService extends BuzzerRoundService {

    async moveToNextQuestionTransaction (transaction, roundId, questionOrder) {
        /* Game: fetch next question and reset every player's state */
        const round = await this.roundRepo.getRoundTransaction(transaction, roundId)

        const questionId = round.questions[questionOrder]
        const defaultThinkingTime = DEFAULT_THINKING_TIME_SECONDS[QuestionType.MATCHING]

        await this.playerRepo.updateAllPlayersStatusTransaction(transaction, PlayerStatus.IDLE)

        // await this.timerRepo.resetTimerTransaction(transaction, managedBy, defaultThinkingTime)
        await this.timerRepo.resetTimerTransaction(transaction, defaultThinkingTime)

        await this.gameQuestionRepo.startQuestionTransaction(transaction, questionId)
        await this.roundRepo.setCurrentQuestionIdxTransaction(questionOrder)
        await this.gameRepo.setCurrentQuestionTransaction(this.gameId, questionId)
        await this.readyRepo.resetReadyTransaction(transaction)
    }


    async calculateMaxPointsTransaction(transaction, round) {
        return round.questions.length * (round.rewardsPerQuestion + round.rewardsForBonus)
    }


}
