import { QuestionType } from '@/backend/models/questions/QuestionType';
import GameBuzzerQuestionRepository from '@/backend/repositories/question/GameBuzzerQuestionRepository';

export default class GameLabellingQuestionRepository extends GameBuzzerQuestionRepository {
  constructor(gameId, roundId) {
    super(gameId, roundId, QuestionType.LABELLING);
  }

  async updateQuestionRevealedElementsTransaction(transaction, questionId, revealed) {
    await this.updateQuestionTransaction(transaction, questionId, {
      revealed,
    });
  }
}
