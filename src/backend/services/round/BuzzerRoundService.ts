import { serverTimestamp, Transaction } from 'firebase/firestore';

import { logger } from '@/backend/logger';
import GameQuestionRepositoryFactory from '@/backend/repositories/question/GameQuestionRepositoryFactory';
import RoundService from '@/backend/services/round/RoundService';
import { GameStatus } from '@/models/games/game-status';
import { GameBuzzerQuestion } from '@/models/questions/buzzer';
import { QuestionType } from '@/models/questions/question-type';
import { BuzzerRound } from '@/models/rounds/buzzer';
import { RoundType } from '@/models/rounds/round-type';
import { AnyRound } from '@/models/rounds/RoundFactory';
import { ScorePolicyType } from '@/models/score-policy';
import { Timer } from '@/models/timer';
import { PlayerStatus } from '@/models/users/player';

export default class BuzzerRoundService extends RoundService {
  constructor(gameId: string, roundType: RoundType) {
    super(gameId, roundType);
    this.log = logger.child({ module: 'BuzzerRoundService', game: gameId });
  }

  async handleRoundSelectedTransaction(transaction: Transaction, roundId: string, userId: string) {
    const playerIds = await this.playerRepo.getAllPlayerIds();
    if (playerIds.length === 0) {
      this.log.warn({ round: roundId }, 'No players in the game, cannot start round');
      throw new Error('No players in the game, cannot start round');
    }

    const round = await this.roundRepo.getRoundTransaction(transaction, roundId);
    if (!round) {
      this.log.warn({ round: roundId }, 'Round not found, cannot start round');
      throw new Error('Round not found, cannot start round');
    }

    const chooser = await this.chooserRepo.getChooserTransaction(transaction);
    if (!chooser) {
      this.log.warn({ round: roundId }, 'Chooser not found, cannot start round');
      throw new Error('Chooser not found, cannot start round');
    }

    const game = await this.gameRepo.getGameTransaction(transaction, this.gameId);
    if (!game) {
      this.log.warn({ round: roundId }, 'Game not found, cannot start round');
      throw new Error('Game not found, cannot start round');
    }

    const roundScorePolicy = game.roundScorePolicy;
    const currentQuestion = game.currentQuestion;
    const currentRound = game.currentRound;

    let prevOrder = -1;
    if (currentRound) {
      const prevRound = await this.roundRepo.getRoundTransaction(transaction, currentRound);
      if (!prevRound) {
        this.log.warn({ round: roundId }, 'Previous round not found');
        throw new Error('Previous round not found');
      }
      prevOrder = prevRound.order!;
    }
    const newOrder = prevOrder + 1;

    let maxPoints = null;
    if (roundScorePolicy === ScorePolicyType.COMPLETION_RATE) {
      maxPoints = await this.calculateMaxPointsTransaction(transaction, round);
      this.log.debug({ round: roundId, maxPoints }, 'Calculated max points');
    }

    if (round.dateStart && !round.dateEnd && currentQuestion) {
      this.log.debug({ round: roundId }, 'Round already started, returning early');
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
      const teamIds = await this.teamRepo.getShuffledTeamIds();
      if (!teamIds) {
        this.log.warn({ round: roundId }, 'No teams found when setting chooser order');
        throw new Error('No teams found when setting chooser order');
      }

      await this.chooserRepo.updateChooserOrderTransaction(transaction, teamIds);
    }

    await this.chooserRepo.resetChoosersTransaction(transaction);

    await this.soundRepo.addSoundTransaction(transaction, 'super_mario_odyssey_moon');

    await this.gameRepo.updateGameTransaction(transaction, this.gameId, {
      currentRound: roundId,
      currentQuestion: null,
      currentQuestionType: this.roundType as QuestionType,
      status: GameStatus.ROUND_START,
    });

    await this.timerRepo.resetTimerTransaction(transaction, Timer.READY_COUNTDOWN_SECONDS);

    this.log.info({ round: roundId }, 'Round successfully started');
  }

  async moveToNextQuestionTransaction(transaction: Transaction, roundId: string, questionOrder: number) {
    const gameQuestionRepo = GameQuestionRepositoryFactory.createRepository(
      this.roundType as QuestionType,
      this.gameId,
      roundId
    );

    /* Game: fetch next question and reset every player's state */
    const playerIds = await this.playerRepo.getAllPlayerIds();
    if (playerIds.length === 0) {
      this.log.warn({ round: roundId }, 'No players in the game, cannot move to next question');
      throw new Error('No players in the game, cannot move to next question');
    }

    const round = await this.roundRepo.getRoundTransaction(transaction, roundId);
    if (!round) {
      this.log.warn({ round: roundId }, 'Round not found, cannot move to next question');
      throw new Error('Round not found, cannot move to next question');
    }

    const questionId = round.questions[questionOrder];
    const gameQuestion = await gameQuestionRepo.getQuestionTransaction(transaction, questionId);
    if (!gameQuestion) {
      this.log.warn({ round: roundId, question: questionId }, 'Question not found, cannot move to next question');
      throw new Error('Question not found, cannot move to next question');
    }

    await this.playerRepo.updateAllPlayersStatusTransaction(transaction, PlayerStatus.IDLE, playerIds);
    await this.timerRepo.resetTimerTransaction(transaction, (gameQuestion as GameBuzzerQuestion).thinkingTime);
    await this.soundRepo.addSoundTransaction(transaction, 'skyrim_skill_increase');
    await this.roundRepo.setCurrentQuestionIdxTransaction(transaction, roundId, questionOrder);
    await this.gameRepo.setCurrentQuestionTransaction(
      transaction,
      this.gameId,
      questionId,
      this.roundType as QuestionType
    );
    await this.readyRepo.resetReadyTransaction(transaction);
    await gameQuestionRepo.startQuestionTransaction(transaction, questionId);
  }

  /* =============================================================================================================== */

  async calculateMaxPointsTransaction(transaction: Transaction, round: AnyRound) {
    const buzzerRound = round as unknown as BuzzerRound;
    return buzzerRound.questions.length * buzzerRound.rewardsPerQuestion;
  }

  /* =============================================================================================================== */
}
