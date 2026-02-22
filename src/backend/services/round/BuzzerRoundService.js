import RoundService from '@/backend/services/round/RoundService';

import { PlayerStatus } from '@/backend/models/users/Player';
import GameQuestionRepositoryFactory from '@/backend/repositories/question/game/GameQuestionRepositoryFactory';
import { Timer, TimerStatus } from '@/backend/models/Timer';
import { ScorePolicyType } from '@/backend/models/ScorePolicy';
import { GameStatus } from '@/backend/models/games/GameStatus';
import { DEFAULT_THINKING_TIME_SECONDS } from '@/backend/utils/question/question';
import { QuestionType } from '@/backend/models/questions/QuestionType';
import { serverTimestamp } from 'firebase/firestore';

export default class BuzzerRoundService extends RoundService {
  constructor(gameId, roundType) {
    super(gameId, roundType);
  }

  async handleRoundSelectedTransaction(transaction, roundId, userId) {
    const playerIds = await this.playerRepo.getAllPlayerIds();
    const round = await this.roundRepo.getRoundTransaction(transaction, roundId);
    const chooser = await this.chooserRepo.getChooserTransaction(transaction, this.chooserId);
    const game = await this.gameRepo.getGameTransaction(transaction, this.gameId);

    // const { type: roundType, questions: questionIds, rewardsPerQuestion, rewardsForBonus, rewardsPerElement } = round
    const roundScorePolicy = game.roundScorePolicy;
    const currentQuestion = game.currentQuestion;
    const currentRound = game.currentRound;

    let prevOrder = -1;
    if (currentRound !== null) {
      const prevRound = await this.roundRepo.getRoundTransaction(transaction, currentRound);
      prevOrder = prevRound.order;
    }
    const newOrder = prevOrder + 1;

    let maxPoints = null;
    if (roundScorePolicy == ScorePolicyType.COMPLETION_RATE) {
      maxPoints = await this.calculateMaxPointsTransaction(transaction, round);
      console.log('Calculated max points', maxPoints);
    }

    if (round.dateStart && !round.dateEnd && currentQuestion) {
      console.log('RETURNING EARLY - round already started');
      await this.gameRepo.updateGameStatusTransaction(transaction, this.gameId, GameStatus.QUESTION_ACTIVE);
      return;
    }

    // Set the status of every player to 'idle'
    await this.playerRepo.updateAllPlayersStatusTransaction(transaction, PlayerStatus.IDLE, playerIds);

    await this.roundRepo.updateRoundTransaction(transaction, roundId, {
      type: this.roundType,
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

    await this.gameRepo.updateGameTransaction(transaction, this.gameId, {
      currentRound: roundId,
      currentQuestion: null,
      currentQuestionType: this.roundType,
      status: GameStatus.ROUND_START,
    });

    console.log('Round successfully started', 'game', this.gameId, 'round', roundId);
  }

  async moveToNextQuestionTransaction(transaction, roundId, questionOrder) {
    console.log('moveToNextQuestionTransaction called with roundId', roundId, 'questionOrder', questionOrder);

    const gameQuestionRepo = GameQuestionRepositoryFactory.createRepository(this.roundType, this.gameId, roundId);

    /* Game: fetch next question and reset every player's state */
    const playerIds = await this.playerRepo.getAllPlayerIds();
    const round = await this.roundRepo.getRoundTransaction(transaction, roundId);
    const questionId = round.questions[questionOrder];
    const defaultThinkingTime = round.thinkingTime;
    console.log('Moving to next question', questionId, 'with thinking time', defaultThinkingTime);

    console.log("Updating players' status to idle and resetting timer for next question");
    await this.playerRepo.updateAllPlayersStatusTransaction(transaction, PlayerStatus.IDLE, playerIds);
    console.log('Players status updated to idle');
    await this.timerRepo.resetTimerTransaction(transaction, defaultThinkingTime);
    console.log('Timer reset for next question');
    await this.soundRepo.addSoundTransaction(transaction, 'skyrim_skill_increase');
    console.log('Sound added for next question');
    await gameQuestionRepo.startQuestionTransaction(transaction, questionId);
    console.log('Game question transaction started for next question', questionId);
    await this.roundRepo.setCurrentQuestionIdxTransaction(transaction, roundId, questionOrder);
    console.log('Current question index updated for next question', questionOrder);
    await this.gameRepo.setCurrentQuestionTransaction(transaction, this.gameId, questionId, this.roundType);
    console.log('Current question updated in game for next question', questionId);
    await this.readyRepo.resetReadyTransaction(transaction);
    console.log('Ready state reset for next question');
  }

  /* =============================================================================================================== */

  async calculateMaxPointsTransaction(transaction, round) {
    return round.questions.length * round.rewardsPerQuestion;
  }

  async prepareQuestionStartTransaction(transaction, roundId, questionId, questionOrder) {
    const gameQuestionRepo = GameQuestionRepositoryFactory.createRepository(this.roundType, this.gameId, roundId);

    const gameQuestion = await gameQuestionRepo.getQuestionTransaction(transaction, questionId);
    const playerIds = await this.playerRepo.getAllIdsTransaction(transaction);

    for (const id of playerIds) {
      await this.playerRepo.updatePlayerStatusTransaction(transaction, id, PlayerStatus.IDLE);
    }

    await this.timerRepo.resetTimerTransaction(transaction, gameQuestion.thinkingTime);
    await this.soundRepo.addSoundTransaction(transaction, 'super_mario_odyssey_moon');

    await gameQuestionRepo.startQuestionTransaction(transaction, questionId);
  }

  /* =============================================================================================================== */
}
