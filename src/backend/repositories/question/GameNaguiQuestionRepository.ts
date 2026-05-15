import { Transaction } from 'firebase/firestore';

import { QuestionType } from '@/models/questions/question-type';

import GameQuestionRepository from './GameQuestionRepository';

export default class GameNaguiQuestionRepository extends GameQuestionRepository {
  constructor(gameId: string, roundId: string) {
    super(gameId, roundId, QuestionType.NAGUI);
  }

  async updateQuestionTeamTransaction(transaction: Transaction, questionId: string, teamId: string): Promise<void> {
    await this.updateQuestionTransaction(transaction, questionId, { teamId });
  }

  async resetQuestionTransaction(transaction: Transaction, questionId: string): Promise<void> {
    await this.updateQuestionTransaction(transaction, questionId, {
      dateEnd: null,
      dateStart: null,
      choiceIdx: null,
      correct: null,
      option: null,
      playerId: null,
      reward: null,
      teamId: null,
      winner: null,
    });
  }
}
