import GameRepository from '@/backend/repositories/game/GameRepository';
import GameScoreRepository from '@/backend/repositories/score/GameScoreRepository';
import RoundRepository from '@/backend/repositories/round/RoundRepository';
import RoundScoreRepository from '@/backend/repositories/score/RoundScoreRepository';
import BaseQuestionRepository from '@/backend/repositories/question/base/BaseQuestionRepository';
import GameQuestionRepositoryFactory from '@/backend/repositories/question/game/GameQuestionRepositoryFactory';

import { firestore } from '@/backend/firebase/firebase';
import { runTransaction, serverTimestamp } from 'firebase/firestore';
import { GameStatus } from '@/backend/models/games/GameStatus';

/**
 * Service for editing a game
 */
export default class EditGameService {
  /**
   * Constructor for the EditGameService
   *
   * @param {string} gameId - The ID of the game
   */
  constructor(gameId) {
    this.gameId = gameId;
    if (!this.gameId) {
      throw new Error('Game ID is required');
    }

    this.gameRepo = new GameRepository();
    this.roundRepo = new RoundRepository(gameId);
    this.gameScoreRepo = new GameScoreRepository(gameId);
    this.baseQuestionRepo = new BaseQuestionRepository();
  }

  /**
   * Adds a round to a game
   *
   * @param {string} roundTitle - The title of the round
   * @param {string} roundType - The type of the round
   */
  async addRoundToGame(roundTitle, roundType) {
    if (!roundTitle) {
      throw new Error('Round title is required');
    }

    if (!roundType) {
      throw new Error('Round type is required');
    }

    try {
      await runTransaction(firestore, async (transaction) => {
        const game = await this.gameRepo.getGameTransaction(transaction, this.gameId);
        const roundScorePolicy = game.roundScorePolicy;

        const round = await this.roundRepo.createRoundTransaction(transaction, roundType, {
          title: roundTitle,
          scorePolicy: roundScorePolicy.type,
        });

        const roundScoreRepo = new RoundScoreRepository(this.gameId, round.id);
        await roundScoreRepo.initializeScoresTransaction(transaction);

        await this.gameRepo.addRoundTransaction(transaction, this.gameId, round.id);

        console.log(`Game ${this.gameId}: Round created successfully.`);
      });
    } catch (error) {
      console.error('There was an error creating the round:', error);
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
  async addQuestionToRound(roundId, questionId, managerId) {
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
        const questionType = baseQuestion.type;

        const gameQuestionRepo = GameQuestionRepositoryFactory.createRepository(questionType, this.gameId, roundId);
        await gameQuestionRepo.createQuestionTransaction(transaction, questionId, managerId, {
          ...baseQuestion.toObject(),
        });

        await this.roundRepo.addGameQuestionTransaction(transaction, roundId, questionId);

        console.log(`Game ${this.gameId}: Question added to round ${roundId} successfully.`);
      });
    } catch (error) {
      console.error('There was an error adding the question:', error);
      throw error;
    }
  }

  /**
   * Removes a round from a game
   *
   * @param {string} roundId - The ID of the round
   */
  async removeRoundFromGame(roundId) {
    if (!roundId) {
      throw new Error('Round ID is required');
    }

    try {
      await runTransaction(firestore, async (transaction) => {
        await this.roundRepo.deleteRoundTransaction(transaction, roundId);
        await this.gameRepo.removeRoundTransaction(transaction, this.gameId, roundId);
      });
    } catch (error) {
      console.error('There was an error removing the round:', error);
      throw error;
    }

    console.log('Round removed successfully', 'gameId: ', this.gameId, 'roundId: ', roundId);
  }

  /**
   * Removes a question from a round
   *
   * @param {string} roundId - The ID of the round
   * @param {string} questionId - The ID of the question
   */
  async removeQuestionFromRound(roundId, questionId) {
    if (!roundId) {
      throw new Error('Round ID is required');
    }
    if (!questionId) {
      throw new Error('Question ID is required');
    }

    await this.roundRepo.removeQuestion(roundId, questionId);

    console.log(
      'Question removed successfully',
      'gameId: ',
      this.gameId,
      'roundId: ',
      roundId,
      'questionId: ',
      questionId
    );
  }

  /**
   * Adds an organizer to a game
   *
   * @param {string} organizerId - The ID of the organizer
   */
  async addOrganizerToGame(organizerId) {
    await this.gameRepo.addOrganizer(this.gameId, organizerId);

    console.log('Organizer added successfully', 'gameId: ', this.gameId, 'organizerId: ', organizerId);
  }

  /**
   * Launches a game
   */
  async launchGame() {
    try {
      await this.gameRepo.updateGame(this.gameId, {
        launchedAt: serverTimestamp(),
        status: GameStatus.GAME_START,
      });
      console.log('Game launched successfully', 'gameId: ', this.gameId);
    } catch (error) {
      console.error('There was an error launching the game:', error);
      throw error;
    }
  }
}
