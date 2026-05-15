import { serverTimestamp, Transaction } from 'firebase/firestore';

import GameLabellingQuestionRepository from '@/backend/repositories/question/GameLabellingQuestionRepository';
import RoundService from '@/backend/services/round/RoundService';
import { GameStatus } from '@/models/games/game-status';
import { LabellingQuestion } from '@/models/questions/labelling';
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
  }

  async handleRoundSelectedTransaction(transaction: Transaction, roundId: string, userId: string) {
    const playerIds = await this.playerRepo.getAllPlayerIds();
    const round = await this.roundRepo.getRoundTransaction(transaction, roundId);
    const chooser = await this.chooserRepo.getChooserTransaction(transaction);
    const game = await this.gameRepo.getGameTransaction(transaction, this.gameId);
    if (!round || !chooser || !game) {
      throw new Error('Round, chooser or game not found');
    }

    const roundScorePolicy = game.roundScorePolicy;
    const currentRound = game.currentRound;
    const currentQuestion = game.currentQuestion;

    let prevOrder = -1;
    if (currentRound !== null) {
      const prevRound = await this.roundRepo.getRoundTransaction(transaction, currentRound!);
      prevOrder = prevRound?.order ?? -1;
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
    const gameQuestionRepo = new GameLabellingQuestionRepository(this.gameId, roundId);

    /* Game: fetch next question and reset every player's state */
    const playerIds = await this.playerRepo.getAllPlayerIds();
    const round = await this.roundRepo.getRoundTransaction(transaction, roundId);
    if (!round) throw new Error('Round not found');
    const questionId = round.questions[questionOrder];
    const gameQuestion = await gameQuestionRepo.getQuestionTransaction(transaction, questionId);
    if (!gameQuestion) throw new Error('Game question not found');

    await this.playerRepo.updateAllPlayersStatusTransaction(transaction, PlayerStatus.IDLE, playerIds);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await this.timerRepo.resetTimerTransaction(transaction, (gameQuestion as any).thinkingTime);
    await this.soundRepo.addSoundTransaction(transaction, 'skyrim_skill_increase');
    await this.roundRepo.setCurrentQuestionIdxTransaction(transaction, roundId, questionOrder);
    await this.gameRepo.setCurrentQuestionTransaction(transaction, this.gameId, questionId, QuestionType.LABELLING);
    await this.readyRepo.resetReadyTransaction(transaction);
    await gameQuestionRepo.startQuestionTransaction(transaction, questionId);
  }

  /* =============================================================================================================== */

  async calculateMaxPointsTransaction(transaction: Transaction, round: AnyRound): Promise<number> {
    const questions = await Promise.all(
      round.questions.map((id) => this.baseQuestionRepo.getQuestionTransaction(transaction, id))
    );
    // The total number of labels to guess in the round
    const totalNumElements = (questions as (LabellingQuestion | null)[]).reduce((acc: number, baseQuestion) => {
      return acc + (baseQuestion?.labels?.length ?? 0);
    }, 0);
    return totalNumElements * (round as LabellingRound).rewardsPerElement;
  }
}
