import { type Transaction } from 'firebase/firestore';

import GameQuestionRepository from '@/backend/repositories/question/GameQuestionRepository';
import { QuestionType } from '@/models/questions/question-type';

export default class GameEstimationQuestionRepository extends GameQuestionRepository {
  constructor(gameId: string, roundId: string) {
    super(gameId, roundId, QuestionType.ESTIMATION);
  }

  async resetQuestionTransaction(transaction: Transaction, questionId: string): Promise<void> {
    await this.updateQuestionTransaction(transaction, questionId, { bets: [] });
    await this.resetQuestionWinnersTransaction(transaction, questionId);
  }

  async updateQuestionWinnersTransaction(
    transaction: Transaction,
    questionId: string,
    winners: string[]
  ): Promise<void> {
    await this.updateQuestionTransaction(transaction, questionId, { winners });
  }

  async resetQuestionWinnersTransaction(transaction: Transaction, questionId: string): Promise<void> {
    await this.updateQuestionTransaction(transaction, questionId, { winners: [] });
  }
}
