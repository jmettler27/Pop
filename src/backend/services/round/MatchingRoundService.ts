import { serverTimestamp, Transaction } from 'firebase/firestore';

import { logger } from '@/backend/logger';
import GameMatchingQuestionRepository from '@/backend/repositories/question/GameMatchingQuestionRepository';
import RoundService from '@/backend/services/round/RoundService';
import { GameStatus } from '@/models/games/game-status';
import { GameMatchingQuestion, MatchingQuestion } from '@/models/questions/matching';
import { QuestionType } from '@/models/questions/question-type';
import { RoundType } from '@/models/rounds/round-type';
import { AnyRound } from '@/models/rounds/RoundFactory';
import { Timer } from '@/models/timer';
import { PlayerStatus } from '@/models/users/player';

export default class MatchingRoundService extends RoundService {
  constructor(gameId: string) {
    super(gameId, RoundType.MATCHING);
    this.log = logger.child({ module: 'MatchingRoundService', game: gameId });
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
      this.log.debug({ round: roundId }, 'Round already started, moving to next question');
      return;
    }

    await this.roundRepo.updateRoundTransaction(transaction, roundId, {
      type: RoundType.MATCHING,
      dateStart: serverTimestamp(),
      order: newOrder,
      currentQuestionIdx: 0,
      maxPoints: 0,
    });

    // If it is the first round, find a random order for the chooser teams
    if (chooser.chooserOrder.length === 0 || chooser.chooserIdx === null) {
      const teamIds = await this.teamRepo.getShuffledTeamIds();
      await this.chooserRepo.updateChooserOrderTransaction(transaction, teamIds);
      this.log.debug({ round: roundId, teamIds }, 'Chooser order set for the round');
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
    const gameQuestionRepo = new GameMatchingQuestionRepository(this.gameId, roundId);

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

    const baseQuestion = await this.baseQuestionRepo.getQuestionTransaction(transaction, questionId);
    if (!baseQuestion) {
      this.log.warn({ round: roundId, question: questionId }, 'Base question not found');
      throw new Error('Base question not found');
    }
    const baseMatchingQuestion = baseQuestion as MatchingQuestion;

    const gameQuestion = await gameQuestionRepo.getQuestionTransaction(transaction, questionId);
    if (!gameQuestion) {
      this.log.warn({ round: roundId, question: questionId }, 'Game question not found');
      throw new Error('Game question not found');
    }
    const gameMatchingQuestion = gameQuestion as GameMatchingQuestion;

    await this.chooserRepo.resetChoosersTransaction(transaction);
    const newChooserTeamId = chooser.chooserOrder[0];
    this.log.debug({ round: roundId, question: questionId, newChooserTeamId }, 'New chooser team for the question');
    await this.playerRepo.updateTeamAndOtherTeamsPlayersStatus(newChooserTeamId, PlayerStatus.FOCUS, PlayerStatus.IDLE);
    await this.timerRepo.startTimerTransaction(
      transaction,
      gameMatchingQuestion.thinkingTime * (baseMatchingQuestion.numCols! - 1)
    );
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

  async calculateMaxPointsTransaction(transaction: Transaction, round: AnyRound): Promise<number> {
    return 0;
  }
}
