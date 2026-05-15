import { arrayUnion, increment, serverTimestamp, Timestamp, type Transaction } from 'firebase/firestore';

import GameQuestionRepository from '@/backend/repositories/question/GameQuestionRepository';
import {
  EnumerationBet,
  EnumerationQuestionPlayers,
  EnumerationQuestionStatus,
  SubmitEnumerationBet,
} from '@/models/questions/enumeration';
import { QuestionType } from '@/models/questions/question-type';

export default class GameEnumerationQuestionRepository extends GameQuestionRepository {
  static ENUMERATION_PLAYERS_PATH = ['realtime', 'players'];

  constructor(gameId: string, roundId: string) {
    super(gameId, roundId, QuestionType.ENUMERATION);
  }

  async resetQuestionTransaction(transaction: Transaction, questionId: string): Promise<void> {
    await this.setPlayersTransaction(transaction, questionId, { bets: [] });
    await this.updateQuestionTransaction(transaction, questionId, {
      status: EnumerationQuestionStatus.THINKING,
      winner: null,
    });
  }

  async deleteQuestionTransaction(transaction: Transaction, questionId: string): Promise<void> {
    await super.deleteQuestionTransaction(transaction, questionId);
    await this.deletePlayersTransaction(transaction, questionId);
  }

  async getPlayersTransaction(
    transaction: Transaction,
    questionId: string
  ): Promise<EnumerationQuestionPlayers | null> {
    const result = await this.getTransaction(transaction, [
      questionId,
      ...GameEnumerationQuestionRepository.ENUMERATION_PLAYERS_PATH,
    ]);
    return result as EnumerationQuestionPlayers | null;
  }

  async updatePlayersTransaction(
    transaction: Transaction,
    questionId: string,
    players: Record<string, unknown>
  ): Promise<void> {
    await this.updateTransaction(
      transaction,
      [questionId, ...GameEnumerationQuestionRepository.ENUMERATION_PLAYERS_PATH],
      players
    );
  }

  async deletePlayersTransaction(transaction: Transaction, questionId: string): Promise<void> {
    await this.deleteTransaction(transaction, [
      questionId,
      ...GameEnumerationQuestionRepository.ENUMERATION_PLAYERS_PATH,
    ]);
  }

  async setPlayersTransaction(
    transaction: Transaction,
    questionId: string,
    data: Record<string, unknown>
  ): Promise<void> {
    await this.setTransaction(
      transaction,
      [questionId, ...GameEnumerationQuestionRepository.ENUMERATION_PLAYERS_PATH],
      data
    );
  }

  async addBetTransaction(transaction: Transaction, questionId: string, bet: SubmitEnumerationBet): Promise<void> {
    await this.updateTransaction(
      transaction,
      [questionId, ...GameEnumerationQuestionRepository.ENUMERATION_PLAYERS_PATH],
      {
        bets: arrayUnion({
          ...bet,
          timestamp: Timestamp.now(),
        }),
      }
    );
  }

  async incrementValidItemsTransaction(transaction: Transaction, questionId: string): Promise<void> {
    await this.updateTransaction(
      transaction,
      [questionId, ...GameEnumerationQuestionRepository.ENUMERATION_PLAYERS_PATH],
      {
        'challenger.numCorrect': increment(1),
      }
    );
  }

  async validateItemTransaction(transaction: Transaction, questionId: string, itemIdx: number): Promise<void> {
    await this.updateTransaction(
      transaction,
      [questionId, ...GameEnumerationQuestionRepository.ENUMERATION_PLAYERS_PATH],
      {
        'challenger.numCorrect': increment(1),
        [`challenger.cited.${itemIdx}`]: serverTimestamp(),
      }
    );
  }

  useQuestionPlayers(questionId: string) {
    const { data, loading, error } = this.useDocument([
      questionId,
      ...GameEnumerationQuestionRepository.ENUMERATION_PLAYERS_PATH,
    ]);
    return { data, loading, error };
  }
}
