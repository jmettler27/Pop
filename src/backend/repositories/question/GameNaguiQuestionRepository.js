import GameQuestionRepository from '@/backend/repositories/question/GameQuestionRepository';

import { QuestionType } from '@/backend/models/questions/QuestionType';

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
      playerId: null,
      teamId: null,
      option: null,
      reward: null,
      correct: null,
    });
  }
}
