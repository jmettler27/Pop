import { increment, type Transaction } from 'firebase/firestore';

import GameBuzzerQuestionRepository from '@/backend/repositories/question/GameBuzzerQuestionRepository';
import { GameProgressiveCluesQuestion } from '@/models/questions/progressive-clues';
import { QuestionType } from '@/models/questions/question-type';

export default class GameProgressiveCluesQuestionRepository extends GameBuzzerQuestionRepository {
  constructor(gameId: string, roundId: string) {
    super(gameId, roundId, QuestionType.PROGRESSIVE_CLUES);
  }

  async createQuestionTransaction(
    transaction: Transaction,
    questionId: string,
    managerId: string,
    data: Record<string, unknown>
  ): Promise<GameProgressiveCluesQuestion> {
    const question = await super.createQuestionTransaction(transaction, questionId, managerId, {
      ...data,
      currentClueIdx: -1,
    });
    return question as GameProgressiveCluesQuestion;
  }

  async resetQuestionTransaction(transaction: Transaction, questionId: string): Promise<void> {
    await super.resetQuestionTransaction(transaction, questionId);
    await this.updateQuestionTransaction(transaction, questionId, { currentClueIdx: -1 });
  }

  async incrementClueTransaction(transaction: Transaction, questionId: string): Promise<void> {
    await this.updateQuestionTransaction(transaction, questionId, { currentClueIdx: increment(1) });
  }
}
