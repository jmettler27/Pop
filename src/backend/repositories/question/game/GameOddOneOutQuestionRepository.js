import GameQuestionRepository from '@/backend/repositories/question/game/GameQuestionRepository';

import { QuestionType } from '@/backend/models/questions/QuestionType';

export default class GameOddOneOutQuestionRepository extends GameQuestionRepository {
  static ODD_ONE_OUT_PLAYERS_PATH = ['realtime', 'players'];

  constructor(gameId, roundId) {
    super(gameId, roundId, QuestionType.ODD_ONE_OUT);
  }

  async resetQuestionTransaction(transaction, questionId) {
    await this.updateQuestionTransaction(transaction, questionId, {
      winner: null,
      selectedItems: [],
    });
  }

  async getPlayersTransaction(transaction, questionId) {
    const data = await this.getTransaction(transaction, [
      questionId,
      ...GameOddOneOutQuestionRepository.ODD_ONE_OUT_PLAYERS_PATH,
    ]);
    // return data ? data.map(p => new Player(p)) : [];
    return data;
  }

  usePlayers(questionId) {
    const { data, loading, error } = super.usePlayers(questionId);
    return {
      // players: data ? data.map(p => new Player(p)) : [],
      data,
      loading,
      error,
    };
  }
}
