import { arrayRemove, arrayUnion, type Transaction } from 'firebase/firestore';

import FirebaseRepository from '@/backend/repositories/FirebaseRepository';
import { CreateGameRoundsData, GameRounds, GameRoundsData } from '@/models/games/game';
import { GameStatus } from '@/models/games/game-status';
import { type GameType } from '@/models/games/game-type';
import GameFactory from '@/models/games/GameFactory';
import { QuestionType } from '@/models/questions/question-type';

export default class GameRepository extends FirebaseRepository {
  static ORGANIZERS_PATH = ['organizers'];

  constructor() {
    super('games');
  }

  async resetGame(gameId: string): Promise<void> {
    await this.updateGame(gameId, {
      currentRound: null,
      currentQuestion: null,
      currentQuestionType: null,
      dateEnd: null,
      dateStart: null,
      status: GameStatus.GAME_START,
    });
  }

  async resetGameTransaction(transaction: Transaction, gameId: string): Promise<void> {
    await this.updateGameTransaction(transaction, gameId, {
      currentRound: null,
      currentQuestion: null,
      currentQuestionType: null,
      dateEnd: null,
      dateStart: null,
      status: GameStatus.GAME_START,
    });
  }

  async getAllGames(): Promise<Array<GameRounds>> {
    const data = await super.getAll();
    return data.map((g) => GameFactory.createGame(g.type as GameType, g));
  }

  async getGamesByStatus(status: string): Promise<Array<Record<string, unknown>>> {
    return super.getByField('status', status);
  }

  async createGame(data: Record<string, unknown>, gameId: string | null = null): Promise<GameRounds> {
    const createData = await super.create(data, gameId);
    return GameFactory.createGame(data.type as GameType, createData);
  }

  async updateGame(gameId: string, data: Record<string, unknown>): Promise<void> {
    await super.update(gameId, data);
  }

  async updateGameTransaction(transaction: Transaction, gameId: string, data: Record<string, unknown>): Promise<void> {
    await super.updateTransaction(transaction, gameId, data);
  }

  async updateGameStatusTransaction(transaction: Transaction, gameId: string, status: string): Promise<void> {
    await super.updateTransaction(transaction, gameId, { status });
  }

  async getGame(gameId: string): Promise<GameRounds | null> {
    const data = await super.get(gameId);
    return data ? new GameRounds(data) : null;
  }

  async getGameTransaction(transaction: Transaction, id: string): Promise<GameRounds | null> {
    const data = await super.getTransaction(transaction, id);
    return data ? new GameRounds(data) : null;
  }

  async createGameTransaction(transaction: Transaction, data: CreateGameRoundsData): Promise<GameRounds> {
    const result = await this.createTransaction(transaction, { ...data, status: GameStatus.GAME_EDIT });
    return GameFactory.createGame(result.type as GameType, result as GameRoundsData);
  }

  async addRoundTransaction(transaction: Transaction, gameId: string, roundId: string): Promise<void> {
    await this.updateTransaction(transaction, gameId, { rounds: arrayUnion(roundId) });
  }

  async removeRoundTransaction(transaction: Transaction, gameId: string, roundId: string): Promise<void> {
    await this.updateTransaction(transaction, gameId, { rounds: arrayRemove(roundId) });
  }

  async setCurrentQuestionTransaction(
    transaction: Transaction,
    gameId: string,
    questionId: string,
    questionType: QuestionType
  ): Promise<void> {
    await this.updateTransaction(transaction, gameId, {
      currentQuestion: questionId,
      currentQuestionType: questionType,
      status: GameStatus.QUESTION_ACTIVE,
    });
  }
}
