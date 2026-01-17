import GameQuestionRepository from '@/backend/repositories/question/game/GameQuestionRepository';

import { QuestionType } from '@/backend/models/questions/QuestionType';

export default class GameMCQQuestionRepository extends GameQuestionRepository {
  constructor(gameId, roundId) {
    super(gameId, roundId, QuestionType.MCQ);
  }

  async updateQuestionTeamTransaction(transaction, questionId, teamId) {
    return await this.updateQuestionTransaction(transaction, questionId, {
      teamId: teamId,
    });
  }
}
