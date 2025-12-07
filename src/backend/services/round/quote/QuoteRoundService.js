import RoundService from "@/backend/services/round/RoundService";
import GameQuoteQuestionRepository from "@/backend/repositories/question/game/GameQuoteQuestionRepository";


export default class QuoteRoundService extends RoundService {

    constructor(gameId, roundId) {
        super(gameId, roundId);
    }

    async getRound() {
        return await this.roundRepo.getRound(this.roundId);
    }

    async calculateMaxPointsTransaction(transaction, round) {
        const questions = await Promise.all(round.questions.map(id => this.questionRepo.getQuestionTransaction(transaction, id)));
        
        const totalNumElements = questions.reduce((acc, baseQuestion) => {
            const toGuess = baseQuestion.toGuess
            const quoteParts = baseQuestion.quoteParts
            return acc + toGuess.length + (toGuess.includes('quote') ? quoteParts.length - 1 : 0);
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

        const gameQuestionRepo = new GameQuoteQuestionRepository(this.gameId, this.roundId)
        await gameQuestionRepo.startQuestionTransaction(transaction, questionId)
    }

}

