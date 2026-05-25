import { type Transaction } from 'firebase/firestore';

import GameBuzzerQuestionRepository from '@/backend/repositories/question/GameBuzzerQuestionRepository';
import { QuestionType } from '@/models/questions/question-type';

export default class GameLabellingQuestionRepository extends GameBuzzerQuestionRepository {
  constructor(gameId: string, roundId: string) {
    super(gameId, roundId, QuestionType.LABELLING);
  }

  async updateQuestionRevealedElementsTransaction(
    transaction: Transaction,
    questionId: string,
    revealed: unknown
  ): Promise<void> {
    await this.updateQuestionTransaction(transaction, questionId, { revealed });
  }
}
