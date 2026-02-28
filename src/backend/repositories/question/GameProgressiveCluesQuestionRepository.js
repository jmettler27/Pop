import { QuestionType } from '@/backend/models/questions/QuestionType';
import GameBuzzerQuestionRepository from '@/backend/repositories/question/GameBuzzerQuestionRepository';

import { increment } from 'firebase/firestore';

export default class GameProgressiveCluesQuestionRepository extends GameBuzzerQuestionRepository {
  constructor(gameId, roundId) {
    super(gameId, roundId, QuestionType.PROGRESSIVE_CLUES);
  }

  async createQuestionTransaction(transaction, questionId, managerId, data) {
    await super.createQuestionTransaction(transaction, questionId, managerId, { ...data, currentClueIdx: -1 });
  }

  async resetQuestionTransaction(transaction, questionId) {
    await super.resetQuestionTransaction(transaction, questionId);
    await this.updateQuestionTransaction(transaction, questionId, {
      currentClueIdx: -1,
    });
  }

  async incrementClueTransaction(transaction, questionId) {
    await this.updateQuestionTransaction(transaction, questionId, {
      currentClueIdx: increment(1),
    });
  }
}
