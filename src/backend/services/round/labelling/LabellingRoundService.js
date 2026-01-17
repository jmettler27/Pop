import { TimerStatus } from '@/backend/models/Timer';
import GameLabellingQuestionRepository from '@/backend/repositories/question/game/GameLabellingQuestionRepository';
import RoundService from '@/backend/services/round/RoundService';
import { ScorePolicyType } from '@/backend/models/ScorePolicy';
import { GameStatus } from '@/backend/models/games/GameStatus';
import { PlayerStatus } from '@/backend/models/users/Player';
import { Timer } from 'lucide-react';
import { serverTimestamp } from 'firebase/firestore';
import { DEFAULT_THINKING_TIME_SECONDS } from '@/backend/utils/question/question';
import { QuestionType } from '@/backend/models/questions/QuestionType';

export default class LabellingRoundService extends RoundService {
  async handleRoundSelectedTransaction(transaction, roundId, userId) {
    const round = await this.roundRepo.getRoundTransaction(transaction, roundId);
    const chooser = await this.chooserRepo.getChooserTransaction(transaction, this.chooserId);
    const game = await this.gameRepo.getGameTransaction(transaction, this.gameId);

    // const { type: roundType, questions: questionIds, rewardsPerQuestion, rewardsForBonus, rewardsPerElement } = round
    const { roundScorePolicy, currentRound, currentQuestion } = game;

    let prevOrder = -1;
    if (currentRound !== null) {
      const prevRound = await this.roundRepo.getRoundTransaction(transaction, currentRound);
      prevOrder = prevRound.order;
    }
    const newOrder = prevOrder + 1;

    let maxPoints = null;
    if (roundScorePolicy === ScorePolicyType.COMPLETION_RATE) {
      maxPoints = await this.calculateMaxPointsTransaction(transaction, round);
    }

    if (round.dateStart && !round.dateEnd && currentQuestion) {
      await this.gameRepo.updateGameStatusTransaction(transaction, this.gameId, GameStatus.QUESTION_ACTIVE);
      return;
    }

    // Set the status of every player to 'idle'
    await this.playerRepo.updateAllPlayersStatusTransaction(transaction, PlayerStatus.IDLE);

    await this.roundRepo.updateRoundTransaction(transaction, roundId, {
      dateStart: serverTimestamp(),
      order: newOrder,
      currentQuestionIdx: 0,
      ...(maxPoints !== null && { maxPoints }),
    });

    // If the round requires an order of chooser teams (e.g. OOO, MCQ) and it is the first round, find a random order for the chooser teams
    if (chooser.chooserOrder.length === 0 || chooser.chooserIdx === null) {
      const teamIds = await this.teamRepo.getShuffledTeamIds(transaction);
      await this.chooserRepo.updateChooserOrderTransaction(transaction, teamIds);
    }

    await this.chooserRepo.resetChoosersTransaction(transaction);

    await this.timerRepo.updateTimerTransaction(transaction, {
      status: TimerStatus.RESET,
      duration: Timer.READY_COUNTDOWN_SECONDS,
      authorized: false,
    });

    await this.soundRepo.addSoundTransaction(transaction, 'super_mario_odyssey_moon');

    await this.gameRepo.updateGameTransaction(transaction, {
      currentRound: roundId,
      currentQuestion: null,
      status: GameStatus.ROUND_START,
    });

    console.log('Round successfully started', 'game', this.gameId, 'round', roundId);
  }

  async moveToNextQuestionTransaction(transaction, roundId, questionOrder) {
    /* Game: fetch next question and reset every player's state */
    const round = await this.roundRepo.getRoundTransaction(transaction, roundId);
    const questionId = round.questions[questionOrder];
    const defaultThinkingTime = DEFAULT_THINKING_TIME_SECONDS[QuestionType.MATCHING];

    await this.playerRepo.updateAllPlayersStatusTransaction(transaction, PlayerStatus.IDLE);
    await this.timerRepo.resetTimerTransaction(transaction, defaultThinkingTime);
    await this.soundRepo.addSoundTransaction(transaction, 'skyrim_skill_increase');
    await this.gameQuestionRepo.startQuestionTransaction(transaction, questionId);
    await this.roundRepo.setCurrentQuestionIdxTransaction(questionOrder);
    await this.gameRepo.setCurrentQuestionTransaction(this.gameId, questionId);
    await this.readyRepo.resetReadyTransaction(transaction);
  }

  /* ============================================================================================================ */

  async calculateMaxPointsTransaction(transaction, round) {
    const questions = await Promise.all(
      round.questionIds.map((id) => this.baseQuestionRepo.getQuestionTransaction(transaction, id))
    );
    // The total number of quote elements to guess in the round
    const totalNumElements = questions.reduce((acc, baseQuestion) => {
      return acc + baseQuestion.labels.length;
    }, 0);
    return totalNumElements * round.rewardsPerElement;
  }

  async prepareQuestionStartTransaction(transaction, questionId, questionOrder) {
    const gameQuestion = await this.gameQuestionRepo.getQuestionTransaction(transaction, questionId);
    const playerIds = await this.playerRepo.getAllIdsTransaction(transaction);

    for (const id of playerIds) {
      await this.playerRepo.updatePlayerStatusTransaction(transaction, id, PlayerStatus.IDLE);
    }

    await this.timerRepo.resetTimerTransaction(transaction, gameQuestion.thinkingTime);
    await this.soundRepo.addSoundTransaction(transaction, 'super_mario_odyssey_moon');

    const gameQuestionRepo = new GameLabellingQuestionRepository(this.gameId, this.roundId);
    await gameQuestionRepo.startQuestionTransaction(transaction, questionId);
  }
}
