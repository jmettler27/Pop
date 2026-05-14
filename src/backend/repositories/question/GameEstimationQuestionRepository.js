import { QuestionType } from '@/backend/models/questions/QuestionType';
import GameQuestionRepository from '@/backend/repositories/question/GameQuestionRepository';

export default class GameEstimationQuestionRepository extends GameQuestionRepository {
  constructor(gameId, roundId) {
    super(gameId, roundId, QuestionType.ESTIMATION);
  }

  async resetQuestionTransaction(transaction, questionId) {
    await this.updateQuestionTransaction(transaction, questionId, {
      bets: [],
    });
    await this.resetQuestionWinnerTransaction(transaction, questionId);
  }

  async updateQuestionWinnerTransaction(transaction, questionId, winners) {
    await this.updateQuestionTransaction(transaction, questionId, {
      winners: winners,
    });
  }

  async resetQuestionWinnerTransaction(transaction, questionId) {
    await this.updateQuestionTransaction(transaction, questionId, {
      winners: [],
    });
  }
}
