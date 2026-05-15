import { type Transaction } from 'firebase/firestore';

import { QuestionType } from '@/models/questions/question-type';

import GameQuestionRepository from './GameQuestionRepository';

export default class GameOddOneOutQuestionRepository extends GameQuestionRepository {
  static ODD_ONE_OUT_PLAYERS_PATH = ['realtime', 'players'];

  constructor(gameId: string, roundId: string) {
    super(gameId, roundId, QuestionType.ODD_ONE_OUT);
  }

  async resetQuestionTransaction(transaction: Transaction, questionId: string): Promise<void> {
    await this.updateQuestionTransaction(transaction, questionId, { winner: null, selectedItems: [] });
  }

  useQuestionPlayers(questionId: string) {
    const { data, loading, error } = this.useDocument([
      questionId,
      ...GameOddOneOutQuestionRepository.ODD_ONE_OUT_PLAYERS_PATH,
    ]);
    return { data, loading, error };
  }
}
