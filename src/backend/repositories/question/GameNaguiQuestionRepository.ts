import { Transaction } from 'firebase/firestore';

import GameBuzzerQuestionRepository from '@/backend/repositories/question/GameBuzzerQuestionRepository';
import { QuestionType } from '@/models/questions/question-type';

export default class GameNaguiQuestionRepository extends GameBuzzerQuestionRepository {
  constructor(gameId: string, roundId: string) {
    super(gameId, roundId, QuestionType.NAGUI);
  }

  async updateQuestionTeamTransaction(transaction: Transaction, questionId: string, teamId: string): Promise<void> {
    await this.updateQuestionTransaction(transaction, questionId, { teamId });
  }
}
