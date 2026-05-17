import { type Transaction } from 'firebase/firestore';

import GameQuestionRepository from '@/backend/repositories/question/GameQuestionRepository';
import { QuestionType } from '@/models/questions/question-type';

export default class GameMCQQuestionRepository extends GameQuestionRepository {
  constructor(gameId: string, roundId: string) {
    super(gameId, roundId, QuestionType.MCQ);
  }

  async updateQuestionTeamTransaction(transaction: Transaction, questionId: string, teamId: string): Promise<void> {
    await this.updateQuestionTransaction(transaction, questionId, { teamId });
  }

  async resetQuestionTransaction(transaction: Transaction, questionId: string): Promise<void> {
    await this.updateQuestionTransaction(transaction, questionId, { reward: null, correct: null });
  }
}
