import { arrayRemove, arrayUnion, Timestamp, type Transaction } from 'firebase/firestore';

import GameQuestionRepository from '@/backend/repositories/question/GameQuestionRepository';
import { BuzzerQuestionPlayers, GameBuzzerQuestion } from '@/models/questions/buzzer';
import { type QuestionType } from '@/models/questions/question-type';

export default class GameBuzzerQuestionRepository extends GameQuestionRepository {
  static BUZZER_PLAYERS_PATH = ['realtime', 'players'];

  constructor(gameId: string, roundId: string, questionType: QuestionType) {
    super(gameId, roundId, questionType);
  }

  async getPlayersTransaction(transaction: Transaction, questionId: string): Promise<BuzzerQuestionPlayers | null> {
    const result = await this.getTransaction(transaction, [
      questionId,
      ...GameBuzzerQuestionRepository.BUZZER_PLAYERS_PATH,
    ]);
    return result ? (result as unknown as BuzzerQuestionPlayers) : null;
  }

  async createQuestionTransaction(
    transaction: Transaction,
    questionId: string,
    managerId: string,
    data: Record<string, unknown>
  ): Promise<GameBuzzerQuestion> {
    const result = await super.createQuestionTransaction(transaction, questionId, managerId, data);
    await this.createTransaction(transaction, { buzzed: [], canceled: [] }, [
      questionId,
      ...GameBuzzerQuestionRepository.BUZZER_PLAYERS_PATH,
    ]);
    return result as GameBuzzerQuestion;
  }

  async resetQuestionTransaction(transaction: Transaction, questionId: string): Promise<void> {
    await this.resetPlayersTransaction(transaction, questionId);
    await this.resetQuestionWinnerTransaction(transaction, questionId);
  }

  async deleteQuestionTransaction(transaction: Transaction, questionId: string): Promise<void> {
    await super.deleteQuestionTransaction(transaction, questionId);
    await this.deletePlayersTransaction(transaction, questionId);
  }

  async updateQuestionWinnerTransaction(
    transaction: Transaction,
    questionId: string,
    playerId: string,
    teamId: string
  ): Promise<void> {
    await this.updateQuestionTransaction(transaction, questionId, { winner: { playerId, teamId } });
  }

  async resetQuestionWinnerTransaction(transaction: Transaction, questionId: string): Promise<void> {
    await this.updateQuestionTransaction(transaction, questionId, { winner: null });
  }

  async updatePlayersTransaction(
    transaction: Transaction,
    questionId: string,
    players: Record<string, unknown>
  ): Promise<void> {
    await this.updateTransaction(
      transaction,
      [questionId, ...GameBuzzerQuestionRepository.BUZZER_PLAYERS_PATH],
      players
    );
  }

  async deletePlayersTransaction(transaction: Transaction, questionId: string): Promise<void> {
    await this.deleteTransaction(transaction, [questionId, ...GameBuzzerQuestionRepository.BUZZER_PLAYERS_PATH]);
  }

  async resetPlayersTransaction(transaction: Transaction, questionId: string): Promise<void> {
    await this.setTransaction(transaction, [questionId, ...GameBuzzerQuestionRepository.BUZZER_PLAYERS_PATH], {
      buzzed: [],
      canceled: [],
    });
  }

  async cancelPlayerTransaction(
    transaction: Transaction,
    questionId: string,
    playerId: string,
    clueIdx = 0
  ): Promise<void> {
    await this.updatePlayersTransaction(transaction, questionId, {
      canceled: arrayUnion({ clueIdx, playerId, timestamp: Timestamp.now() }),
      buzzed: arrayRemove(playerId),
    });
  }

  async clearBuzzedPlayersTransaction(transaction: Transaction, questionId: string): Promise<void> {
    await this.updateTransaction(transaction, [questionId, ...GameBuzzerQuestionRepository.BUZZER_PLAYERS_PATH], {
      buzzed: [],
    });
  }

  async addPlayerToBuzzerTransaction(transaction: Transaction, questionId: string, playerId: string): Promise<void> {
    await this.updatePlayersTransaction(transaction, questionId, { buzzed: arrayUnion(playerId) });
  }

  async removePlayerFromBuzzerTransaction(
    transaction: Transaction,
    questionId: string,
    playerId: string
  ): Promise<void> {
    await this.updatePlayersTransaction(transaction, questionId, { buzzed: arrayRemove(playerId) });
  }

  async clearBuzzerTransaction(transaction: Transaction, questionId: string): Promise<void> {
    await this.updatePlayersTransaction(transaction, questionId, { buzzed: [] });
  }

  useQuestionPlayers(questionId: string) {
    const { data, loading, error } = this.useDocument([
      questionId,
      ...GameBuzzerQuestionRepository.BUZZER_PLAYERS_PATH,
    ]);
    return { data, loading, error };
  }
}
