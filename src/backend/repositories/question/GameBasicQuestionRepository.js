import GameQuestionRepository from '@/backend/repositories/question/GameQuestionRepository';

import { QuestionType } from '@/backend/models/questions/QuestionType';

export default class GameBasicQuestionRepository extends GameQuestionRepository {
  constructor(gameId, roundId) {
    super(gameId, roundId, QuestionType.BASIC);
  }

  async resetQuestionTransaction(transaction, questionId) {
    await this.updateQuestionTransaction(transaction, questionId, {
      teamId: null,
      correct: null,
    });
  }
}
