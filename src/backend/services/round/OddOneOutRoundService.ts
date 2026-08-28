import { FieldValue, Transaction } from 'firebase-admin/firestore';

import { logger } from '@/backend/logger';
import GameOddOneOutQuestionRepository from '@/backend/repositories/question/GameOddOneOutQuestionRepository';
import RoundService from '@/backend/services/round/RoundService';
import { GameStatus } from '@/models/games/game-status';
import { QuestionType } from '@/models/questions/question-type';
import { RoundType } from '@/models/rounds/round-type';
import { Timer } from '@/models/timer';
import { PlayerStatus } from '@/models/users/player';

export default class OddOneOutRoundService extends RoundService {
  constructor(gameId: string) {
    super(gameId, RoundType.ODD_ONE_OUT);
    this.log = logger.child({ module: 'OddOneOutRoundService', game: gameId });
  }

  async handleRoundSelectedTransaction(transaction: Transaction, roundId: string, userId: string) {
    const round = await this.roundRepo.getRoundTransaction(transaction, roundId);
    if (!round) {
      this.log.warn({ round: roundId }, 'Round not found');
      throw new Error('Round not found');
    }

    const chooser = await this.chooserRepo.getChooserTransaction(transaction);
    if (!chooser) {
      this.log.warn({ round: roundId }, 'Chooser not found');
      throw new Error('Chooser not found');
    }

    const game = await this.gameRepo.getGameTransaction(transaction, this.gameId);
    if (!game) {
      this.log.warn({ round: roundId }, 'Game not found');
      throw new Error('Game not found');
    }

    const currentRound = game.currentRound;
    const currentQuestion = game.currentQuestion;

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

    if (round.dateStart && !round.dateEnd && currentQuestion) {
      await this.gameRepo.updateGameStatusTransaction(transaction, this.gameId, GameStatus.QUESTION_ACTIVE);
      return;
    }

    // If it is the first round, a random chooser order is needed. Read it before any write below.
    const needsChooserOrder = chooser.chooserOrder.length === 0 || chooser.chooserIdx === null;
    const shuffledTeamIds = needsChooserOrder ? await this.teamRepo.getShuffledTeamIdsTransaction(transaction) : null;

    await this.roundRepo.updateRoundTransaction(transaction, roundId, {
      type: RoundType.ODD_ONE_OUT,
      dateStart: FieldValue.serverTimestamp(),
      order: newOrder,
      currentQuestionIdx: 0,
      maxPoints: 0,
    });

    if (needsChooserOrder) {
      await this.chooserRepo.updateChooserOrderTransaction(transaction, shuffledTeamIds!);
    }

    await this.chooserRepo.resetChoosersTransaction(transaction);

    await this.soundRepo.addSoundTransaction(transaction, 'super_mario_odyssey_moon');

    await this.gameRepo.updateGameTransaction(transaction, this.gameId, {
      currentRound: roundId,
      currentQuestion: null,
      currentQuestionType: this.roundType,
      status: GameStatus.ROUND_START,
    });

    await this.timerRepo.resetTimerTransaction(transaction, Timer.READY_COUNTDOWN_SECONDS);

    this.log.info({ round: roundId }, 'Round successfully started');
  }

  async moveToNextQuestionTransaction(transaction: Transaction, roundId: string, questionOrder: number) {
    const gameQuestionRepo = new GameOddOneOutQuestionRepository(this.gameId, roundId);

    /* Game: fetch next question and reset every player's state */
    const round = await this.roundRepo.getRoundTransaction(transaction, roundId);
    if (!round) {
      this.log.warn({ round: roundId }, 'Round not found');
      throw new Error('Round not found');
    }

    const chooser = await this.chooserRepo.getChooserTransaction(transaction);
    if (!chooser) {
      this.log.warn({ round: roundId }, 'Chooser not found');
      throw new Error('Chooser not found');
    }

    const questionId = round.questions[questionOrder];
    const gameQuestion = await gameQuestionRepo.getQuestionTransaction(transaction, questionId);
    if (!gameQuestion) {
      this.log.warn({ round: roundId, question: questionId }, 'Game question not found');
      throw new Error('Game question not found');
    }
    await this.chooserRepo.resetChoosersTransaction(transaction);
    const newChooserTeamId = chooser.chooserOrder[0];
    this.pendingStatus.enqueueTeamAndOthers(newChooserTeamId, PlayerStatus.FOCUS, PlayerStatus.IDLE);
    await this.timerRepo.startTimerTransaction(transaction, gameQuestion.thinkingTime);
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
}
