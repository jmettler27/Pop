import { runTransaction, serverTimestamp } from 'firebase/firestore';
import type { Logger } from 'pino';

import { firestore } from '@/backend/firebase/firebase';
import { logger } from '@/backend/logger';
import GameRepository from '@/backend/repositories/game/GameRepository';
import BaseQuestionRepository from '@/backend/repositories/question/BaseQuestionRepository';
import GameQuestionRepositoryFactory from '@/backend/repositories/question/GameQuestionRepositoryFactory';
import RoundRepository from '@/backend/repositories/round/RoundRepository';
import GameScoreRepository from '@/backend/repositories/score/GameScoreRepository';
import RoundScoreRepository from '@/backend/repositories/score/RoundScoreRepository';
import { GameStatus } from '@/models/games/game-status';
import { QuestionType } from '@/models/questions/question-type';
import { RoundData } from '@/models/rounds/round';
import { RoundType } from '@/models/rounds/round-type';
import { ScorePolicyType } from '@/models/score-policy';
import { Timer } from '@/models/timer';

/**
 * Service for editing a game
 */
export default class EditGameService {
  private gameId: string;
  private gameRepo: GameRepository;
  private roundRepo: RoundRepository;
  private gameScoreRepo: GameScoreRepository;
  private baseQuestionRepo: BaseQuestionRepository;
  private log: Logger;

  constructor(gameId: string) {
    this.gameId = gameId;
    if (!this.gameId) {
      throw new Error('Game ID is required');
    }

    this.log = logger.child({ module: 'EditGameService', game: this.gameId });
    this.gameRepo = new GameRepository();
    this.roundRepo = new RoundRepository(gameId);
    this.gameScoreRepo = new GameScoreRepository(gameId);
    this.baseQuestionRepo = new (BaseQuestionRepository as any)() as BaseQuestionRepository;
  }

  /**
   * Adds a round to a game
   *
   * @param {string} roundTitle - The title of the round
   * @param {RoundType} roundType - The type of the round
   */
  async addRoundToGame(roundTitle: string, roundType: RoundType) {
    if (!roundTitle) {
      throw new Error('Round title is required');
    }

    if (!roundType) {
      throw new Error('Round type is required');
    }

    try {
      await runTransaction(firestore, async (transaction) => {
        const game = await this.gameRepo.getGameTransaction(transaction, this.gameId);
        if (!game) {
          this.log.error('Game not found');
          throw new Error();
        }

        const roundScorePolicy = game.roundScorePolicy as ScorePolicyType;

        const round = await this.roundRepo.createRoundTransaction(transaction, roundType, {
          title: roundTitle,
          scorePolicy: roundScorePolicy,
          currentQuestionIdx: 0,
        });

        const roundScoreRepo = new RoundScoreRepository(this.gameId, round.id!);
        await roundScoreRepo.initializeScoresTransaction(transaction);

        await this.gameRepo.addRoundTransaction(transaction, this.gameId, round.id!);

        this.log.info({ roundId: round.id }, 'Round created successfully');
      });
    } catch (error) {
      this.log.error({ err: error }, 'Failed to create the round');
      throw error;
    }
  }

  /**
   * Adds a question to a round
   *
   * @param {string} roundId - The ID of the round
   * @param {string} questionId - The ID of the question
   * @param {string} managerId - The ID of the manager
   */
  async addQuestionToRound(roundId: string, questionId: string, managerId: string) {
    if (!roundId) {
      throw new Error('Round ID is required');
    }
    if (!questionId) {
      throw new Error('Question ID is required');
    }
    if (!managerId) {
      throw new Error('Manager ID is required');
    }

    try {
      await runTransaction(firestore, async (transaction) => {
        const baseQuestion = await this.baseQuestionRepo.getQuestionTransaction(transaction, questionId);
        if (!baseQuestion) {
          throw new Error('Question not found');
        }
        const questionType = baseQuestion.type;

        const gameQuestionRepo = GameQuestionRepositoryFactory.createRepository(questionType, this.gameId, roundId);
        await gameQuestionRepo.createQuestionTransaction(transaction, questionId, managerId, {
          ...baseQuestion.toObject(),
        });

        await this.roundRepo.addQuestionTransaction(transaction, roundId, questionId);

        this.log.info({ roundId, questionId }, 'Question added to round successfully');
      });
    } catch (error) {
      this.log.error({ err: error }, 'Failed to add the question');
      throw error;
    }
  }

  /**
   * Removes a round from a game
   *
   * @param {string} roundId - The ID of the round
   */
  async removeRoundFromGame(roundId: string) {
    if (!roundId) {
      throw new Error('Round ID is required');
    }

    try {
      await runTransaction(firestore, async (transaction) => {
        await this.roundRepo.deleteRoundTransaction(transaction, roundId);
        await this.gameRepo.removeRoundTransaction(transaction, this.gameId, roundId);
      });
    } catch (error) {
      this.log.error({ err: error }, 'Failed to remove the round');
      throw error;
    }

    this.log.info({ roundId }, 'Round removed successfully');
  }

  /**
   * Removes a question from a round
   *
   * @param {QuestionType} questionType - The type of the question
   * @param {string} roundId - The ID of the round
   * @param {string} questionId - The ID of the question
   */
  async removeQuestionFromRound(questionType: QuestionType, roundId: string, questionId: string) {
    if (!roundId) {
      throw new Error('Round ID is required');
    }
    if (!questionId) {
      throw new Error('Question ID is required');
    }

    try {
      await runTransaction(firestore, async (transaction) => {
        const gameQuestionRepo = GameQuestionRepositoryFactory.createRepository(questionType, this.gameId, roundId);
        await gameQuestionRepo.deleteQuestionTransaction(transaction, questionId);
        await this.roundRepo.removeQuestionTransaction(transaction, roundId, questionId);
      });
    } catch (error) {
      this.log.error({ err: error }, 'Failed to remove the question from round');
      throw error;
    }

    this.log.info({ roundId, questionId }, 'Question removed from round successfully');
  }

  /**
   * Reorders questions in a round
   *
   * @param {string} roundId - The ID of the round
   * @param {RoundData} roundData - The complete round data with updated questions array
   */
  async updateRound(roundId: string, roundData: RoundData) {
    if (!roundId) {
      throw new Error('Round ID is required');
    }
    if (!roundData || typeof roundData !== 'object') {
      throw new Error('Round data object is required');
    }

    await this.roundRepo.updateRound(roundId, roundData);

    this.log.info({ roundId, questions: roundData.questions }, 'Round updated successfully');
  }

  async updateRoundThinkingTime(roundId: string, thinkingTime: number) {
    if (!roundId) throw new Error('Round ID is required');
    if (
      typeof thinkingTime !== 'number' ||
      thinkingTime < Timer.MIN_THINKING_TIME_SECONDS ||
      thinkingTime > Timer.MAX_THINKING_TIME_SECONDS
    )
      throw new Error(
        `Thinking time must be between ${Timer.MIN_THINKING_TIME_SECONDS} and ${Timer.MAX_THINKING_TIME_SECONDS} seconds`
      );
    await runTransaction(firestore, async (transaction) => {
      const round = await this.roundRepo.getRoundTransaction(transaction, roundId);
      if (!round) {
        throw new Error('Round not found');
      }

      const gameQuestionRepo = GameQuestionRepositoryFactory.createRepository(
        round.type as QuestionType,
        this.gameId,
        roundId
      );

      for (const questionId of round.questions) {
        await gameQuestionRepo.updateQuestionTransaction(transaction, questionId, { thinkingTime });
      }

      await this.roundRepo.updateRoundTransaction(transaction, roundId, { thinkingTime });
    });

    this.log.info({ roundId, thinkingTime }, 'Round thinking time updated');
  }

  async updateQuestionThinkingTime(
    questionType: QuestionType,
    roundId: string,
    questionId: string,
    thinkingTime: number
  ) {
    if (!roundId) throw new Error('Round ID is required');
    if (!questionId) throw new Error('Question ID is required');
    if (
      typeof thinkingTime !== 'number' ||
      thinkingTime < Timer.MIN_THINKING_TIME_SECONDS ||
      thinkingTime > Timer.MAX_THINKING_TIME_SECONDS
    )
      throw new Error(
        `Thinking time must be between ${Timer.MIN_THINKING_TIME_SECONDS} and ${Timer.MAX_THINKING_TIME_SECONDS} seconds`
      );
    const gameQuestionRepo = GameQuestionRepositoryFactory.createRepository(questionType, this.gameId, roundId);
    await gameQuestionRepo.update(questionId, { thinkingTime });
    this.log.info({ roundId, questionId, thinkingTime }, 'Game question thinking time updated');
  }

  async updateRoundChallengeTime(roundId: string, challengeTime: number) {
    if (!roundId) throw new Error('Round ID is required');
    if (
      typeof challengeTime !== 'number' ||
      challengeTime < Timer.MIN_CHALLENGE_TIME_SECONDS ||
      challengeTime > Timer.MAX_CHALLENGE_TIME_SECONDS
    )
      throw new Error(
        `Challenge time must be between ${Timer.MIN_CHALLENGE_TIME_SECONDS} and ${Timer.MAX_CHALLENGE_TIME_SECONDS} seconds`
      );
    await runTransaction(firestore, async (transaction) => {
      const round = await this.roundRepo.getRoundTransaction(transaction, roundId);
      if (!round) {
        throw new Error('Round not found');
      }

      const gameQuestionRepo = GameQuestionRepositoryFactory.createRepository(
        round.type as QuestionType,
        this.gameId,
        roundId
      );

      for (const questionId of round.questions) {
        await gameQuestionRepo.updateQuestionTransaction(transaction, questionId, { challengeTime });
      }

      await this.roundRepo.updateRoundTransaction(transaction, roundId, { challengeTime });
    });

    this.log.info({ roundId, challengeTime }, 'Round challenge time updated');
  }

  async updateQuestionChallengeTime(
    questionType: QuestionType,
    roundId: string,
    questionId: string,
    challengeTime: number
  ) {
    if (!roundId) throw new Error('Round ID is required');
    if (!questionId) throw new Error('Question ID is required');
    if (
      typeof challengeTime !== 'number' ||
      challengeTime < Timer.MIN_CHALLENGE_TIME_SECONDS ||
      challengeTime > Timer.MAX_CHALLENGE_TIME_SECONDS
    )
      throw new Error(
        `Challenge time must be between ${Timer.MIN_CHALLENGE_TIME_SECONDS} and ${Timer.MAX_CHALLENGE_TIME_SECONDS} seconds`
      );
    const gameQuestionRepo = GameQuestionRepositoryFactory.createRepository(questionType, this.gameId, roundId);
    await gameQuestionRepo.update(questionId, { challengeTime });
    this.log.info({ roundId, questionId, challengeTime }, 'Game question challenge time updated');
  }

  async launchGame() {
    try {
      await this.gameRepo.updateGame(this.gameId, {
        launchedAt: serverTimestamp(),
        status: GameStatus.GAME_START,
      });
      this.log.info('Game launched successfully');
    } catch (error) {
      this.log.error({ err: error }, 'Failed to launch the game');
      throw error;
    }
  }
}
