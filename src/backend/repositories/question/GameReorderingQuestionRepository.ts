import { type Transaction } from 'firebase/firestore';

import GameQuestionRepository from '@/backend/repositories/question/GameQuestionRepository';
import { QuestionType } from '@/models/questions/question-type';

export default class GameReorderingQuestionRepository extends GameQuestionRepository {
  constructor(gameId: string, roundId: string) {
    super(gameId, roundId, QuestionType.REORDERING);
  }

  async resetQuestionTransaction(transaction: Transaction, questionId: string): Promise<void> {
    await this.updateQuestionTransaction(transaction, questionId, { dateStart: null, dateEnd: null, orderings: null });
  }
}
