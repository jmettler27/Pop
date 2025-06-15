import { TimerStatus } from "@/backend/models/Timer";
import GameLabellingQuestionRepository from "@/backend/repositories/question/game/GameLabellingQuestionRepository";
import RoundService from "@/backend/services/round/RoundService";

export default class LabellingRoundService extends RoundService {

    constructor(gameId, roundId) {
        super(gameId, roundId)
    }

    async calculateMaxPointsTransaction(transaction, round) {
        const questions = await Promise.all(round.questionIds.map(id => this.baseQuestionRepo.getQuestionTransaction(transaction, id)));
        // The total number of quote elements to guess in the round
        const totalNumElements = questions.reduce((acc, baseQuestion) => {
            return acc + baseQuestion.labels.length;
        }, 0);
        return totalNumElements * round.rewardsPerElement;
    }

    async prepareQuestionStartTransaction(transaction, questionId, questionOrder) {
        const gameQuestion = await this.gameQuestionRepo.getQuestionTransaction(transaction, questionId)
        const playerIds = await this.playerRepo.getAllIdsTransaction(transaction)

        for (const id of playerIds) {
            await this.playerRepo.updatePlayerStatusTransaction(transaction, id, PlayerStatus.IDLE)
        }

        await this.timerRepo.resetTimerTransaction(transaction, gameQuestion.thinkingTime)
        await this.soundRepo.addSoundTransaction(transaction, 'skyrim_skill_increase')

        const gameQuestionRepo = new GameLabellingQuestionRepository(this.gameId, this.roundId)
        await gameQuestionRepo.startQuestionTransaction(transaction, questionId)
    }

}
