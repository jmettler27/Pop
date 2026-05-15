import GameQuestionRepository from '@/backend/repositories/question/GameQuestionRepository';
import { QuestionType } from '@/models/questions/QuestionType';

export default class GameNaguiQuestionRepository extends GameQuestionRepository {
  constructor(gameId, roundId) {
    super(gameId, roundId, QuestionType.NAGUI);
  }

  async updateQuestionTeamTransaction(transaction, questionId, teamId) {
    await this.updateQuestionTransaction(transaction, questionId, {
      teamId: teamId,
    });
  }

  async resetQuestionTransaction(transaction, questionId) {
    await this.updateQuestionTransaction(transaction, questionId, {
      option: null,
      reward: null,
      correct: null,
    });
  }
}
