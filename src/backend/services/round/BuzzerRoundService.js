import RoundService from '@/backend/services/round/RoundService';

import { PlayerStatus } from '@/backend/models/users/Player';
import GameQuestionRepositoryFactory from '@/backend/repositories/question/game/GameQuestionRepositoryFactory';
import { TimerStatus } from '@/backend/models/Timer';
import { ScorePolicyType } from '@/backend/models/ScorePolicy';
import { Timer } from '@/backend/models/Timer';
import { GameStatus } from '@/backend/models/games/GameStatus';
import { DEFAULT_THINKING_TIME_SECONDS } from '@/backend/utils/question/question';
import { QuestionType } from '@/backend/models/questions/QuestionType';
import { getDocs, query } from 'firebase/firestore';
import { updateTimerTransaction } from '@/backend/repositories/timer/timer';

export default class BuzzerRoundService extends RoundService {
  constructor(gameId, roundType) {
    super(gameId, roundType);
  }

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

  /* =============================================================================================================== */

  async calculateMaxPointsTransaction(transaction, round) {
    return round.questions.length * (round.rewardsPerQuestion + round.rewardsForBonus);
  }

  async prepareQuestionStartTransaction(transaction, roundId, questionId, questionOrder) {
    const gameQuestion = await this.gameQuestionRepo.getQuestionTransaction(transaction, questionId);
    const playerIds = await this.playerRepo.getAllIdsTransaction(transaction);

    for (const id of playerIds) {
      await this.playerRepo.updatePlayerStatusTransaction(transaction, id, PlayerStatus.IDLE);
    }

    await this.timerRepo.resetTimerTransaction(transaction, gameQuestion.thinkingTime);
    await this.soundRepo.addSoundTransaction(transaction, 'super_mario_odyssey_moon');

    const gameQuestionRepo = GameQuestionRepositoryFactory.createRepository(this.roundType, this.gameId, roundId);
    await gameQuestionRepo.startQuestionTransaction(transaction, questionId);
  }

  /* =============================================================================================================== */
}
