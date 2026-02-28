import { GameStatus } from '@/backend/models/games/GameStatus';

import GameRepository from '@/backend/repositories/game/GameRepository';
import PlayerRepository from '@/backend/repositories/user/PlayerRepository';
import TimerRepository from '@/backend/repositories/timer/TimerRepository';
import GameQuestionRepositoryFactory from '@/backend/repositories/question/GameQuestionRepositoryFactory';
import BaseQuestionRepositoryFactory from '@/backend/repositories/question/BaseQuestionRepositoryFactory';
import SoundRepository from '@/backend/repositories/sound/SoundRepository';
import RoundScoreRepository from '@/backend/repositories/score/RoundScoreRepository';

import { firestore } from '@/backend/firebase/firebase';
import { runTransaction, serverTimestamp } from 'firebase/firestore';
import GameScoreRepository from '@/backend/repositories/score/GameScoreRepository';
import { increment } from 'firebase/firestore';
import RoundRepository from '@/backend/repositories/round/RoundRepository';
import RoundQuestionRepositoryFactory from '@/backend/repositories/round/RoundRepositoryFactory';
import TeamRepository from '@/backend/repositories/user/TeamRepository';

export default class GameQuestionService {
  constructor(gameId, roundId, questionType) {
    if (!gameId) {
      throw new Error('Game ID is required');
    }
    if (!roundId) {
      throw new Error('Round ID is required');
    }
    if (!questionType) {
      throw new Error('Question type is required');
    }

    this.gameId = gameId;
    this.gameRepo = new GameRepository();
    this.gameScoreRepo = new GameScoreRepository(gameId);
    this.playerRepo = new PlayerRepository(gameId);
    this.teamRepo = new TeamRepository(gameId);
    this.timerRepo = new TimerRepository(gameId);
    this.soundRepo = new SoundRepository(gameId);

    this.questionType = questionType;
    this.baseQuestionRepo = BaseQuestionRepositoryFactory.createRepository(questionType);

    this.roundId = roundId;
    this.roundRepo = RoundQuestionRepositoryFactory.createRepository(questionType, gameId);
    this.roundScoreRepo = new RoundScoreRepository(gameId, roundId);
    this.gameQuestionRepo = GameQuestionRepositoryFactory.createRepository(questionType, gameId, roundId);
  }

  async resetQuestion(questionId) {
    if (!questionId) {
      throw new Error('Question ID is required');
    }

    try {
      await runTransaction(firestore, (transaction) => this.resetQuestionTransaction(transaction, questionId));
    } catch (error) {
      console.error(
        'Failed to reset the question',
        'game',
        this.gameId,
        'round',
        this.roundId,
        'question',
        questionId,
        'err',
        error
      );
      throw error;
    }
  }

  async resetQuestionTransaction(transaction, questionId) {
    // this.gameQuestionRepo.updateTransaction(transaction, questionId, {
    //     winner: null,
    //     selectedItems: [],
    // });

    // if (alone) {
    //     this.timerRepo.resetTimerTransaction(transaction, questionId);
    // }
    throw new Error('Not implemented');
  }

  /* ==================================================================================================== */

  async endQuestion(questionId) {
    if (!questionId) {
      throw new Error('Question ID is required');
    }

    try {
      await runTransaction(firestore, (transaction) => this.endQuestionTransaction(transaction, questionId));
    } catch (error) {
      console.error(
        'Failed to end the question',
        'game',
        this.gameId,
        'round',
        this.roundId,
        'question',
        questionId,
        'err',
        error
      );
      throw error;
    }
  }

  async endQuestionTransaction(transaction, questionId) {
    await this.gameRepo.updateGameStatusTransaction(transaction, this.gameId, GameStatus.QUESTION_END);
    await this.gameQuestionRepo.endQuestionTransaction(transaction, questionId);
    await this.timerRepo.prepareTimerForReadyTransaction(transaction);

    console.log(
      'Buzzer question successfully ended',
      'game',
      this.gameId,
      'round',
      this.roundId,
      'question',
      questionId,
      'type',
      this.questionType
    );
  }

  /* ==================================================================================================== */

  async handleCountdownEnd(questionId) {
    if (!questionId) {
      throw new Error('Question ID is required');
    }

    try {
      await runTransaction(firestore, (transaction) => this.handleCountdownEndTransaction(transaction, questionId));
    } catch (error) {
      console.error(
        'Failed to handle question countdown',
        'game',
        this.gameId,
        'round',
        this.roundId,
        'question',
        questionId,
        'err',
        error
      );
      throw error;
    }
  }

  async handleCountdownEndTransaction(transaction, questionId) {
    throw new Error('Not implemented');
  }

  /* ==================================================================================================== */
  // export const increaseTeamScoreTransaction = async (
  //     transaction,
  //     gameId,
  //     roundId,
  //     questionId,
  //     teamId = null,
  //     points = 0
  // ) => {
  //     const roundScoresRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'realtime', 'scores')
  //     const roundScoresData = await getDocDataTransaction(transaction, roundScoresRef)

  //     const { scores: currRoundScores, scoresProgress: currRoundProgress } = roundScoresData

  //     const newRoundProgress = {}
  //     for (const tid of Object.keys(currRoundScores)) {
  //         newRoundProgress[tid] = {
  //             ...currRoundProgress[tid],
  //             [questionId]: currRoundScores[tid] + (tid === teamId) * points
  //         }
  //     }
  //     transaction.update(roundScoresRef, {
  //         [`scores.${teamId}`]: increment(points),
  //         scoresProgress: newRoundProgress
  //     })
  // }

  async increaseGlobalTeamScoreTransaction(transaction, gameId, roundId, teamId = null, points = 0) {
    const gameScores = await this.gameScoreRepo.getScoresTransaction(transaction);
    const currentGameScores = gameScores.scores;
    const currentGameProgress = gameScores.scoresProgress;

    // Update progress for all teams
    const newGameProgress = {};
    for (const tid of Object.keys(currentGameScores)) {
      newGameProgress[tid] = {
        ...currentGameProgress[tid],
        [roundId]: currentGameScores[tid] + (tid === teamId) * points,
      };
    }

    // Update scores
    await this.gameScoreRepo.updateScoresTransaction(transaction, {
      [`scores.${teamId}`]: increment(points),
      scoresProgress: newGameProgress,
    });
  }

  async decreaseGlobalTeamScoreTransaction(transaction, questionId, penalty, teamId = null) {
    const gameScores = await this.gameScoreRepo.getScoresTransaction(transaction);
    const roundScores = await this.roundScoreRepo.getScoresTransaction(transaction);

    // Decrease the team's global score by the penalty
    const mistakePenalty = penalty;
    const currentGameScores = gameScores.scores;
    const currentGameProgress = gameScores.scoresProgress;
    const newGameProgress = {};
    for (const tid of Object.keys(currentGameScores)) {
      newGameProgress[tid] = {
        ...currentGameProgress[tid],
        [this.roundId]: currentGameScores[tid] + (tid === teamId) * mistakePenalty,
      };
    }

    await this.gameScoreRepo.updateScoresTransaction(transaction, {
      [`scores.${teamId}`]: increment(mistakePenalty),
      scoresProgress: newGameProgress,
    });

    // Increase the team's round "score" to 1. In this context, 1 is rather an increment to the counter of mistakes of the team in the round, that a point added to round score
    const currRoundScores = roundScores.scores;
    const currRoundProgress = roundScores.scoresProgress;
    const newRoundProgress = {};
    for (const tid of Object.keys(currRoundScores)) {
      newRoundProgress[tid] = {
        ...currRoundProgress[tid],
        [questionId]: currRoundScores[tid] + (tid === teamId),
      };
    }
    await this.roundScoreRepo.updateScoresTransaction(transaction, {
      [`scores.${teamId}`]: increment(1),
      scoresProgress: newRoundProgress,
    });
  }
}
