import RoundService from '@/backend/services/round/RoundService';
import GameQuoteQuestionRepository from '@/backend/repositories/question/game/GameQuoteQuestionRepository';
import { ScorePolicyType } from '@/backend/models/ScorePolicy';
import { GameStatus } from '@/backend/models/games/GameStatus';
import { PlayerStatus } from '@/backend/models/users/Player';
import { serverTimestamp } from 'firebase/firestore';
import { Timer, TimerStatus } from '@/backend/models/Timer';
import { RoundType } from '@/backend/models/rounds/RoundType';

export default class QuoteRoundService extends RoundService {
  constructor(gameId) {
    super(gameId, RoundType.QUOTE);
  }

  async handleRoundSelectedTransaction(transaction, roundId, userId) {
    const playerIds = await this.playerRepo.getAllPlayerIds();
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
    await this.playerRepo.updateAllPlayersStatusTransaction(transaction, PlayerStatus.IDLE, playerIds);

    await this.roundRepo.updateRoundTransaction(transaction, roundId, {
      type: RoundType.QUOTE,
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
      status: GameStatus.ROUND_START,
    });

    console.log('Round successfully started', 'game', this.gameId, 'round', roundId);
  }

  /* =============================================================================================================== */

  async calculateMaxPointsTransaction(transaction, round) {
    const questions = await Promise.all(
      round.questions.map((id) => this.questionRepo.getQuestionTransaction(transaction, id))
    );

    const totalNumElements = questions.reduce((acc, baseQuestion) => {
      const toGuess = baseQuestion.toGuess;
      const quoteParts = baseQuestion.quoteParts;
      return acc + toGuess.length + (toGuess.includes('quote') ? quoteParts.length - 1 : 0);
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

    const gameQuestionRepo = new GameQuoteQuestionRepository(this.gameId, this.roundId);
    await gameQuestionRepo.startQuestionTransaction(transaction, questionId);
  }
}
