import {PlayerStatus} from "@/backend/models/users/Player";

import RoundService from "@/backend/services/round/RoundService";
import GameOddOneOutQuestionRepository from "@/backend/repositories/question/game/GameOddOneOutQuestionRepository";
import {GameStatus} from "@/backend/models/games/GameStatus";
import {serverTimestamp} from "firebase/firestore";
import {DEFAULT_THINKING_TIME_SECONDS} from "@/backend/utils/question/question";
import {QuestionType} from "@/backend/models/questions/QuestionType";

export default class OddOneOutRoundService extends RoundService {

    async handleRoundSelectedTransaction(transaction, roundId, userId) {
        const round = await this.roundRepo.getRoundTransaction(transaction, roundId)
        const chooser = await this.chooserRepo.getChooserTransaction(transaction, this.chooserId)
        const game = await this.gameRepo.getGameTransaction(transaction, this.gameId)

        const currentRound = game.currentRound
        const currentQuestion = game.currentQuestion

        let prevOrder = -1
        if (currentRound !== null) {
            const prevRound = await this.roundRepo.getRoundTransaction(transaction, currentRound)
            prevOrder = prevRound.order
        }
        const newOrder = prevOrder + 1

        if (round.dateStart && !round.dateEnd && currentQuestion) {
            await this.gameRepo.updateGameStatusTransaction(transaction, this.gameId, GameStatus.QUESTION_ACTIVE)
            return;
        }

        await this.roundRepo.updateRoundTransaction(transaction, roundId, {
            dateStart: serverTimestamp(),
            order: newOrder,
            currentQuestionIdx: 0,
            maxPoints: 0,
        })

        // If it is the first round, find a random order for the chooser teams
        if (chooser.chooserOrder.length === 0 || chooser.chooserIdx === null) {
            const teamIds = await this.teamRepo.getShuffledTeamIds(transaction)
            await this.chooserRepo.updateChooserOrderTransaction(transaction, teamIds);
        }

        await this.chooserRepo.resetChoosersTransaction(transaction);

        await this.soundRepo.addSoundTransaction(transaction, 'super_mario_odyssey_moon')

        await this.gameRepo.updateGameTransaction(transaction, {
            currentRound: roundId,
            currentQuestion: null,
            status: GameStatus.ROUND_START
        })

        console.log('Round successfully started', 'game', this.gameId,  'round', roundId)
    }

    async moveToNextQuestionTransaction (transaction, roundId, questionOrder) {
        /* Game: fetch next question and reset every player's state */
        const round = await this.roundRepo.getRoundTransaction(transaction, roundId)
        const chooser = await this.chooserRepo.getChooserTransaction(transaction, this.gameId)

        const questionId = round.questions[questionOrder]
        const baseQuestion = await this.baseQuestionRepo.getQuestionTransaction(transaction, questionId)

        // const baseQuestion = await getDocDataTransaction(transaction, baseQuestionRef)
        const defaultThinkingTime = DEFAULT_THINKING_TIME_SECONDS[QuestionType.MATCHING]

        await this.chooserRepo.resetChoosersTransaction(transaction);
        const newChooserTeamId =  chooser.chooserOrder[0]
        await this.playerRepo.updateTeamAndOtherTeamsPlayersStatusTransaction(transaction, newChooserTeamId, PlayerStatus.FOCUS, PlayerStatus.IDLE)

        // await this.timerRepo.resetTimerTransaction(transaction, { status: TimerStatus.RESET, managedBy, duration: defaultThinkingTime })
        await this.timerRepo.resetTimerTransaction(transaction, defaultThinkingTime)

        await this.soundRepo.addSoundTransaction(transaction, 'skyrim_skill_increase')
        await this.gameQuestionRepo.startQuestionTransaction(transaction, questionId)
        await this.roundRepo.setCurrentQuestionIdxTransaction(questionOrder)
        await this.gameRepo.setCurrentQuestionTransaction(this.gameId, questionId)
        await this.readyRepo.resetReadyTransaction(transaction)
    }


    /* ============================================================================================================ */

    async calculateMaxPointsTransaction(transaction, round) {
        return round.questions.length * (round.rewardsPerQuestion + round.rewardsForBonus)
    }

    async prepareQuestionStartTransaction(transaction, questionId, questionOrder) {
        const gameQuestion = await this.gameQuestionRepo.getQuestionTransaction(transaction, questionId)

        const chooser = await this.chooserRepo.getChooserTransaction(transaction)
        const newChooserTeamId = chooser.chooserOrder[0]

        const choosers = await this.playerRepo.getPlayersByTeamIdTransaction(transaction, newChooserTeamId)
        const nonChoosers = await this.playerRepo.getAllOtherPlayersTransaction(transaction, newChooserTeamId)

        await this.chooserRepo.resetChoosersTransaction(transaction)

        for (const player of choosers) {
            await this.playerRepo.updatePlayerStatusTransaction(transaction, player.id, PlayerStatus.FOCUS)
        }
        for (const player of nonChoosers) {
            await this.playerRepo.updatePlayerStatusTransaction(transaction, player.id, PlayerStatus.IDLE)
        }
        
        await this.timerRepo.resetTimerTransaction(transaction, gameQuestion.thinkingTime)

        const gameQuestionRepo = new GameOddOneOutQuestionRepository(this.gameId, this.roundId)
        await gameQuestionRepo.startQuestionTransaction(transaction, questionId)
    }
}
