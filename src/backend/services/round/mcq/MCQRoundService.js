import { TimerStatus } from "@/backend/models/Timer";
import RoundService from "@/backend/services/round/RoundService";
import GameMCQQuestionRepository from "@/backend/repositories/question/game/GameMCQQuestionRepository";


export default class MCQRoundService extends RoundService {

    constructor(gameId, roundId) {
        super(gameId, roundId)
    }

    async calculateMaxPointsTransaction(transaction, round) {
        const numTeams = await this.teamRepo.getNumTeams(transaction)
        return Math.ceil(round.questions.length / numTeams) * round.rewardsPerQuestion;
    }

    async prepareQuestionStartTransaction(transaction, questionId, questionOrder) {
        const baseQuestion = await this.baseQuestionRepo.getQuestionTransaction(transaction, questionId)

        const chooser = await this.chooserRepo.getChooserTransaction(transaction)
        const { chooserOrder, chooserIdx } = chooser
        const chooserTeamId = chooserOrder[chooserIdx]
    
        if (questionOrder > 0) {
            const newChoosers = await this.playerRepo.getPlayersByTeamIdTransaction(transaction, newChooserTeamId)
            const prevChoosers = await this.playerRepo.getPlayersByTeamIdTransaction(transaction, chooserTeamId)

            const newChooserIdx = getNextCyclicIndex(chooserIdx, chooserOrder.length)
            const newChooserTeamId = chooserOrder[newChooserIdx]
            await this.chooserRepo.updateChooserTransaction(transaction, {
                chooserIdx: newChooserIdx
            })
            await this.gameQuestionRepo.updateQuestionTransaction(transaction, questionId, {
                teamId: newChooserTeamId,
            })
            for (const player of newChoosers) {
                await this.playerRepo.updatePlayerStatusTransaction(transaction, player.id, PlayerStatus.FOCUS)
            }
            for (const player of prevChoosers) {
                await this.playerRepo.updatePlayerStatusTransaction(transaction, player.id, PlayerStatus.IDLE)
            }
        } else {
            await this.gameQuestionRepo.updateQuestionTransaction(transaction, questionId, {
                teamId: chooserTeamId,
            })
        }
        await this.timerRepo.updateTimerTransaction(transaction, { status: TimerStatus.RESET, duration: baseQuestion.thinkingTime })
        await this.soundRepo.addSoundTransaction(transaction, 'skyrim_skill_increase')

        const gameQuestionRepo = new GameMCQQuestionRepository(this.gameId, this.roundId)
        await gameQuestionRepo.startQuestionTransaction(transaction, questionId)
    }

}
