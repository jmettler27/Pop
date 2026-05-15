import GameQuestionRepository from '@/backend/repositories/question/GameQuestionRepository';
import { QuestionType } from '@/models/questions/QuestionType';

export default class GameReorderingQuestionRepository extends GameQuestionRepository {
  constructor(gameId, roundId) {
    super(gameId, roundId, QuestionType.REORDERING);
  }

  async resetQuestionTransaction(transaction, questionId) {
    await this.updateQuestionTransaction(transaction, questionId, {
      dateStart: null,
      dateEnd: null,
      orderings: null,
    });
  }
}
