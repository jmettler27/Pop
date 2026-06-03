import { serverTimestamp, Transaction } from 'firebase/firestore';

import { logger } from '@/backend/logger';
import GameMCQQuestionRepository from '@/backend/repositories/question/GameMCQQuestionRepository';
import RoundService from '@/backend/services/round/RoundService';
import { getNextCyclicIndex, shuffle } from '@/backend/utils/arrays';
import { GameStatus } from '@/models/games/game-status';
import { QuestionType } from '@/models/questions/question-type';
import { MCQRound } from '@/models/rounds/mcq';
import { RoundType } from '@/models/rounds/round-type';
import { AnyRound } from '@/models/rounds/RoundFactory';
import { ScorePolicyType } from '@/models/score-policy';
import { Timer } from '@/models/timer';
import { PlayerStatus } from '@/models/users/player';

export default class MCQRoundService extends RoundService {
  constructor(gameId: string) {
    super(gameId, RoundType.MCQ);
    this.log = logger.child({ module: 'MCQRoundService', game: gameId });
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

    const questionIds = round.questions;
    const roundScorePolicy = game.roundScorePolicy;
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

    await this.roundRepo.updateRoundTransaction(transaction, roundId, {
      type: RoundType.MCQ,
      dateStart: serverTimestamp(),
      order: newOrder,
      currentQuestionIdx: 0,
      questions: shuffle(questionIds),
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
    const gameQuestionRepo = new GameMCQQuestionRepository(this.gameId, roundId);

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

    const chooserOrder = chooser.chooserOrder;
    const chooserIdx = chooser.chooserIdx;

    if (questionOrder > 0) {
      const newChooserIdx = getNextCyclicIndex(chooserIdx, chooserOrder.length);
      const newChooserTeamId = chooserOrder[newChooserIdx];
      await this.chooserRepo.updateChooserIndexTransaction(transaction, newChooserIdx);
      await gameQuestionRepo.updateQuestionTeamTransaction(transaction, questionId, newChooserTeamId);
      await this.playerRepo.updateTeamAndOtherTeamsPlayersStatus(
        newChooserTeamId,
        PlayerStatus.FOCUS,
        PlayerStatus.IDLE
      );
    } else {
      const chooserTeamId = chooserOrder[chooserIdx];
      await gameQuestionRepo.updateQuestionTeamTransaction(transaction, questionId, chooserTeamId);
    }

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

  /* =============================================================================================================== */

  async calculateMaxPointsTransaction(transaction: Transaction, round: AnyRound): Promise<number> {
    const mcqRound = round as MCQRound;
    const numTeams = await this.teamRepo.getNumTeams();
    if (!numTeams) {
      this.log.warn({ round: round.id }, 'No teams found when calculating max points for completion rate policy');
      throw new Error('No teams found when calculating max points for completion rate policy');
    }
    return Math.ceil(mcqRound.questions.length / numTeams) * mcqRound.rewardsPerQuestion;
  }
}
