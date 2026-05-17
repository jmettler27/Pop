import { serverTimestamp, Transaction } from 'firebase/firestore';

import GameMatchingQuestionRepository from '@/backend/repositories/question/GameMatchingQuestionRepository';
import RoundService from '@/backend/services/round/RoundService';
import { GameStatus } from '@/models/games/game-status';
import { GameMatchingQuestion, MatchingQuestion } from '@/models/questions/matching';
import { QuestionType } from '@/models/questions/question-type';
import { MatchingRound } from '@/models/rounds/matching';
import { RoundType } from '@/models/rounds/round-type';
import { AnyRound } from '@/models/rounds/RoundFactory';
import { Timer } from '@/models/timer';
import { PlayerStatus } from '@/models/users/player';

export default class MatchingRoundService extends RoundService {
  constructor(gameId: string) {
    super(gameId, RoundType.MATCHING);
  }

  async handleRoundSelectedTransaction(transaction: Transaction, roundId: string, userId: string) {
    const round = await this.roundRepo.getRoundTransaction(transaction, roundId);
    if (!round) {
      console.log();
      throw new Error();
    }

    const chooser = await this.chooserRepo.getChooserTransaction(transaction);
    if (!chooser) {
      console.log();
      throw new Error();
    }

    const game = await this.gameRepo.getGameTransaction(transaction, this.gameId);
    if (!game) {
      console.log();
      throw new Error();
    }

    const currentRound = game.currentRound;
    const currentQuestion = game.currentQuestion;

    let prevOrder = -1;
    if (currentRound !== undefined) {
      const prevRound = await this.roundRepo.getRoundTransaction(transaction, currentRound);
      if (!prevRound || !prevRound.order) {
        console.log();
        throw new Error();
      }
      prevOrder = prevRound.order!;
    }
    const newOrder = prevOrder + 1;

    if (round.dateStart && !round.dateEnd && currentQuestion) {
      await this.gameRepo.updateGameStatusTransaction(transaction, this.gameId, GameStatus.QUESTION_ACTIVE);
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

    console.log('Round successfully started', 'game', this.gameId, 'round', roundId);
  }

  async moveToNextQuestionTransaction(transaction: Transaction, roundId: string, questionOrder: number) {
    const gameQuestionRepo = new GameMatchingQuestionRepository(this.gameId, roundId);

    /* Game: fetch next question and reset every player's state */
    const round = await this.roundRepo.getRoundTransaction(transaction, roundId);
    if (!round) {
      console.log();
      throw new Error();
    }

    const chooser = await this.chooserRepo.getChooserTransaction(transaction);
    if (!chooser) {
      console.log();
      throw new Error();
    }

    const questionId = round.questions[questionOrder];

    const baseQuestion = await this.baseQuestionRepo.getQuestionTransaction(transaction, questionId);
    if (!baseQuestion) {
      console.log();
      throw new Error();
    }
    const baseMatchingQuestion = baseQuestion as MatchingQuestion;

    const gameQuestion = await gameQuestionRepo.getQuestionTransaction(transaction, questionId);
    if (!gameQuestion) {
      console.log();
      throw new Error();
    }
    const gameMatchingQuestion = gameQuestion as GameMatchingQuestion;

    await this.chooserRepo.resetChoosersTransaction(transaction);
    const newChooserTeamId = chooser.chooserOrder[0];
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
