import GameQuestionRepository from '@/backend/repositories/question/GameQuestionRepository';
import { QuestionType } from '@/models/questions/QuestionType';

export default class GameMCQQuestionRepository extends GameQuestionRepository {
  constructor(gameId, roundId) {
    super(gameId, roundId, QuestionType.MCQ);
  }

  async updateQuestionTeamTransaction(transaction, questionId, teamId) {
    await this.updateQuestionTransaction(transaction, questionId, {
      teamId: teamId,
    });
  }

  async resetQuestionTransaction(transaction, questionId) {
    await this.updateQuestionTransaction(transaction, questionId, {
      reward: null,
      correct: null,
    });
  }
}
