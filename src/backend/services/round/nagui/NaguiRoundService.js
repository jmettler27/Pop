import RoundService from "@/backend/services/round/RoundService";
import {serverTimestamp} from "firebase/firestore";
import GameNaguiQuestionRepository from "@/backend/repositories/question/game/GameNaguiQuestionRepository";
import {ScorePolicyType} from "@/backend/models/ScorePolicy";
import {GameStatus} from "@/backend/models/games/GameStatus";
import {getNextCyclicIndex, shuffle} from "@/backend/utils/arrays";
import {TimerStatus} from "@/backend/models/Timer";
import {Timer} from "lucide-react";
import {HideNaguiOption} from "@/backend/models/questions/Nagui";
import {DEFAULT_THINKING_TIME_SECONDS} from "@/backend/utils/question/question";
import {QuestionType} from "@/backend/models/questions/QuestionType";
import {PlayerStatus} from "@/backend/models/users/Player";


export default class NaguiRoundService extends RoundService {


    async handleRoundSelectedTransaction(transaction, roundId, userId) {
        const round = await this.roundRepo.getRoundTransaction(transaction, roundId)
        const chooser = await this.chooserRepo.getChooserTransaction(transaction, this.chooserId)
        const game = await this.gameRepo.getGameTransaction(transaction, this.gameId)

        const questionIds = round.questions
        const roundScorePolicy = game.roundScorePolicy
        const currentRound = game.currentRound
        const currentQuestion = game.currentQuestion


        let prevOrder = -1
        if (currentRound !== null) {
            const prevRound = await this.roundRepo.getRoundTransaction(transaction, currentRound)
            prevOrder = prevRound.order
        }
        const newOrder = prevOrder + 1

        let maxPoints = null
        if (roundScorePolicy === ScorePolicyType.COMPLETION_RATE) {
            maxPoints = await this.calculateMaxPointsTransaction(transaction, round)
        }

        if (round.dateStart && !round.dateEnd && currentQuestion) {
            await this.gameRepo.updateGameStatusTransaction(transaction, this.gameId, GameStatus.QUESTION_ACTIVE)
            return
        }

        await this.roundRepo.updateRoundTransaction(transaction, roundId, {
            dateStart: serverTimestamp(),
            order: newOrder,
            currentQuestionIdx: 0,
            questions: shuffle(questionIds),
            ...(maxPoints !== null && { maxPoints })
        })


        // If the round requires an order of chooser teams (e.g. OOO, MCQ) and it is the first round, find a random order for the chooser teams
        if (chooser.chooserOrder.length === 0 || chooser.chooserIdx === null) {
            const teamIds = await this.teamRepo.getShuffledTeamIds(transaction)
            await this.chooserRepo.updateChooserOrderTransaction(transaction, teamIds);
        }

        await this.chooserRepo.resetChoosersTransaction(transaction);

        await this.timerRepo.updateTimerTransaction(transaction, {
            status: TimerStatus.RESET,
            duration: Timer.READY_COUNTDOWN_SECONDS,
            authorized: false
        })

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
        const defaultThinkingTime = DEFAULT_THINKING_TIME_SECONDS[QuestionType.MCQ]

        const chooserOrder = chooser.chooserOrder
        const chooserIdx = chooser.chooserIdx

        if (questionOrder > 0) {
            const newChooserIdx = getNextCyclicIndex(chooserIdx, chooserOrder.length)
            const newChooserTeamId = chooserOrder[newChooserIdx]
            await this.chooserRepo.updateChooserIndexTransaction(transaction, newChooserIdx)
            await this.gameQuestionRepo.updateQuestionTeamTransaction(transaction, questionId, newChooserTeamId)
            await this.playerRepo.updateTeamAndOtherTeamsPlayersStatusTransaction(transaction, newChooserTeamId, PlayerStatus.FOCUS, PlayerStatus.IDLE)
        } else {
            const chooserTeamId = chooserOrder[chooserIdx]
            await this.gameQuestionRepo.updateQuestionTeamTransaction(transaction, questionId, chooserTeamId)
        }

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
        const numTeams = await this.teamRepo.getNumTeams(transaction)
        return Math.ceil(round.questions.length / numTeams) * round.rewardsPerQuestion[HideNaguiOption.TYPE];
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
        await this.timerRepo.resetTimerTransaction(transaction, baseQuestion.thinkingTime)
        await this.soundRepo.addSoundTransaction(transaction, 'super_mario_odyssey_moon')

        const gameQuestionRepo = new GameNaguiQuestionRepository(this.gameId, this.roundId)
        await gameQuestionRepo.startQuestionTransaction(transaction, questionId)
    }

}
