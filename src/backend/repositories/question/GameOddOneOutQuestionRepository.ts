import { type Transaction } from 'firebase/firestore';

import GameBuzzerQuestionRepository from '@/backend/repositories/question/GameBuzzerQuestionRepository';
import { QuestionType } from '@/models/questions/question-type';

export default class GameOddOneOutQuestionRepository extends GameBuzzerQuestionRepository {
  static ODD_ONE_OUT_PLAYERS_PATH = ['realtime', 'players'];

  constructor(gameId: string, roundId: string) {
    super(gameId, roundId, QuestionType.ODD_ONE_OUT);
  }

  async resetQuestionTransaction(transaction: Transaction, questionId: string): Promise<void> {
    await this.updateQuestionTransaction(transaction, questionId, { winner: null, selectedItems: [] });
  }

  useQuestionPlayers(questionId: string) {
    return super.useQuestionPlayers(questionId);
  }
}
