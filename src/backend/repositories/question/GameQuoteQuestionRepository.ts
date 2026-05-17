import { arrayRemove, arrayUnion, Timestamp, type Transaction } from 'firebase/firestore';

import GameBuzzerQuestionRepository from '@/backend/repositories/question/GameBuzzerQuestionRepository';
import { BuzzerQuestionPlayers } from '@/models/questions/buzzer';
import { QuestionType } from '@/models/questions/question-type';
import { GameQuoteQuestion } from '@/models/questions/quote';

export default class GameQuoteQuestionRepository extends GameBuzzerQuestionRepository {
  static QUOTE_PLAYERS_PATH = ['realtime', 'players'];

  constructor(gameId: string, roundId: string) {
    super(gameId, roundId, QuestionType.QUOTE);
  }

  async getPlayersTransaction(transaction: Transaction, questionId: string): Promise<BuzzerQuestionPlayers | null> {
    const result = await this.getTransaction(transaction, [
      questionId,
      ...GameQuoteQuestionRepository.QUOTE_PLAYERS_PATH,
    ]);
    return result ? (result as unknown as BuzzerQuestionPlayers) : null;
  }

  async createQuestionTransaction(
    transaction: Transaction,
    questionId: string,
    managerId: string,
    data: Record<string, unknown>
  ): Promise<GameQuoteQuestion> {
    const result = await super.createQuestionTransaction(transaction, questionId, managerId, data);
    await this.createTransaction(transaction, { buzzed: [], canceled: [] }, [
      questionId,
      ...GameQuoteQuestionRepository.QUOTE_PLAYERS_PATH,
    ]);
    return result as unknown as GameQuoteQuestion;
  }

  async updateQuestionRevealedElementsTransaction(
    transaction: Transaction,
    questionId: string,
    revealed: unknown
  ): Promise<void> {
    await this.updateQuestionTransaction(transaction, questionId, { revealed });
  }

  async updateQuestionWinnerTransaction(
    transaction: Transaction,
    questionId: string,
    playerId: string,
    teamId: string
  ): Promise<void> {
    await this.updateTransaction(transaction, [questionId, ...GameQuoteQuestionRepository.QUOTE_PLAYERS_PATH], {
      winner: { playerId, teamId },
    });
  }

  async resetPlayersTransaction(transaction: Transaction, questionId: string): Promise<void> {
    await this.setTransaction(transaction, [questionId, ...GameQuoteQuestionRepository.QUOTE_PLAYERS_PATH], {
      buzzed: [],
      canceled: [],
    });
  }

  async cancelPlayerTransaction(transaction: Transaction, questionId: string, playerId: string): Promise<void> {
    await this.updateTransaction(transaction, [questionId, ...GameQuoteQuestionRepository.QUOTE_PLAYERS_PATH], {
      canceled: arrayUnion({ playerId, timestamp: Timestamp.now() }),
      buzzed: arrayRemove(playerId),
    });
  }

  async clearBuzzedPlayersTransaction(transaction: Transaction, questionId: string): Promise<void> {
    await this.updateTransaction(transaction, [questionId, ...GameQuoteQuestionRepository.QUOTE_PLAYERS_PATH], {
      buzzed: [],
    });
  }

  useQuestionPlayers(questionId: string) {
    const { data, loading, error } = this.useDocument([questionId, ...GameQuoteQuestionRepository.QUOTE_PLAYERS_PATH]);
    return { data, loading, error };
  }
}
