import { serverTimestamp, Transaction } from 'firebase/firestore';

import { logger } from '@/backend/logger';
import GameLabellingQuestionRepository from '@/backend/repositories/question/GameLabellingQuestionRepository';
import RoundService from '@/backend/services/round/RoundService';
import { GameStatus } from '@/models/games/game-status';
import { GameLabellingQuestion, LabellingQuestion } from '@/models/questions/labelling';
import { QuestionType } from '@/models/questions/question-type';
import { LabellingRound } from '@/models/rounds/labelling';
import { RoundType } from '@/models/rounds/round-type';
import { AnyRound } from '@/models/rounds/RoundFactory';
import { ScorePolicyType } from '@/models/score-policy';
import { Timer } from '@/models/timer';
import { PlayerStatus } from '@/models/users/player';

export default class LabellingRoundService extends RoundService {
  constructor(gameId: string) {
    super(gameId, RoundType.LABELLING);
    this.log = logger.child({ module: 'LabellingRoundService', game: gameId });
  }

  async handleRoundSelectedTransaction(transaction: Transaction, roundId: string, userId: string) {
    const playerIds = await this.playerRepo.getAllPlayerIds();
    if (!playerIds || playerIds.length === 0) {
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
    const currentRound = game.currentRound;
    const currentQuestion = game.currentQuestion;

    let prevOrder = -1;
    if (currentRound !== null) {
      const prevRound = await this.roundRepo.getRoundTransaction(transaction, currentRound!);
      prevOrder = prevRound?.order ?? -1;
      this.log.debug({ round: roundId, prevRound }, 'Previous round fetched');
    }
    const newOrder = prevOrder + 1;

    let maxPoints = null;
    if (roundScorePolicy === ScorePolicyType.COMPLETION_RATE) {
      maxPoints = await this.calculateMaxPointsTransaction(transaction, round);
      this.log.debug({ round: roundId, maxPoints }, 'Max points calculated for completion rate policy');
    }

    if (round.dateStart && !round.dateEnd && currentQuestion) {
      await this.gameRepo.updateGameStatusTransaction(transaction, this.gameId, GameStatus.QUESTION_ACTIVE);
      this.log.debug({ round: roundId }, 'Round already started, moving to next question');
      return;
    }

    // Set the status of every player to 'idle'
    await this.playerRepo.updateAllPlayersStatusTransaction(transaction, PlayerStatus.IDLE, playerIds);

    await this.roundRepo.updateRoundTransaction(transaction, roundId, {
      type: RoundType.LABELLING,
      dateStart: serverTimestamp(),
      order: newOrder,
      currentQuestionIdx: 0,
      ...(maxPoints !== null && { maxPoints }),
    });

    // If the round requires an order of chooser teams (e.g. OOO, MCQ) and it is the first round, find a random order for the chooser teams
    if ((chooser.chooserOrder as unknown[]).length === 0 || chooser.chooserIdx === null) {
      const teamIds = await this.teamRepo.getShuffledTeamIds();
      if (!teamIds) {
        this.log.warn({ round: roundId }, 'No teams found when setting chooser order');
        throw new Error('No teams found when setting chooser order');
      }

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
    const gameQuestionRepo = new GameLabellingQuestionRepository(this.gameId, roundId);

    const round = await this.roundRepo.getRoundTransaction(transaction, roundId);
    if (!round) {
      this.log.warn({ round: roundId }, 'Round not found');
      throw new Error('Round not found');
    }

    const questionId = round.questions[questionOrder];
    const gameQuestion = await gameQuestionRepo.getQuestionTransaction(transaction, questionId);
    if (!gameQuestion) {
      this.log.warn({ round: roundId, question: questionId }, 'Game question not found');
      throw new Error('Game question not found');
    }

    const playerIds = await this.playerRepo.getAllPlayerIds();
    if (!playerIds || playerIds.length === 0) {
      this.log.warn({ round: roundId }, 'No players in the game, cannot start question');
      throw new Error('No players in the game, cannot start question');
    }

    await this.playerRepo.updateAllPlayersStatusTransaction(transaction, PlayerStatus.IDLE, playerIds);
    await this.timerRepo.resetTimerTransaction(transaction, (gameQuestion as GameLabellingQuestion).thinkingTime);
    await this.soundRepo.addSoundTransaction(transaction, 'skyrim_skill_increase');
    await this.roundRepo.setCurrentQuestionIdxTransaction(transaction, roundId, questionOrder);
    await this.gameRepo.setCurrentQuestionTransaction(transaction, this.gameId, questionId, QuestionType.LABELLING);
    await this.readyRepo.resetReadyTransaction(transaction);
    await gameQuestionRepo.startQuestionTransaction(transaction, questionId);
  }

  /* =============================================================================================================== */

  async calculateMaxPointsTransaction(transaction: Transaction, round: AnyRound): Promise<number> {
    const questions = await Promise.all(
      round.questions.map((id: string) => this.baseQuestionRepo.getQuestionTransaction(transaction, id))
    );
    // The total number of labels to guess in the round
    const totalNumElements = (questions as (LabellingQuestion | null)[]).reduce((acc: number, baseQuestion) => {
      return acc + (baseQuestion?.labels?.length ?? 0);
    }, 0);
    return totalNumElements * (round as LabellingRound).rewardsPerElement;
  }
}
