import GameQuestionRepository from '@/backend/repositories/question/game/GameQuestionRepository';

import { QuestionType } from '@/backend/models/questions/QuestionType';
import { arrayRemove, arrayUnion, Timestamp } from 'firebase/firestore';

export default class GameLabellingQuestionRepository extends GameQuestionRepository {
  static LABELLING_PLAYERS_PATH = ['realtime', 'players'];

  constructor(gameId, roundId) {
    super(gameId, roundId, QuestionType.LABELLING);
  }

  async getPlayersTransaction(transaction, questionId) {
    const data = await this.getTransaction(transaction, [
      questionId,
      ...GameLabellingQuestionRepository.LABELLING_PLAYERS_PATH,
    ]);
    // return data ? data.map(p => new Player(p)) : [];
    return data;
  }

  async createQuestionTransaction(transaction, questionId, managerId, data) {
    await super.createQuestionTransaction(transaction, questionId, managerId, data);
    await this.createTransaction(
      transaction,
      {
        buzzed: [],
        canceled: [],
      },
      [questionId, ...GameLabellingQuestionRepository.LABELLING_PLAYERS_PATH]
    );
  }

  async updateQuestionRevealedElementsTransaction(transaction, questionId, revealed) {
    await this.updateQuestionTransaction(transaction, questionId, {
      revealed,
    });
  }

  async resetPlayersTransaction(transaction, questionId) {
    await this.setTransaction(transaction, [questionId, ...GameLabellingQuestionRepository.LABELLING_PLAYERS_PATH], {
      buzzed: [],
      canceled: [],
    });
  }

  async updatePlayersTransaction(transaction, questionId, players) {
    await this.updateTransaction(
      transaction,
      [questionId, ...GameLabellingQuestionRepository.BUZZER_PLAYERS_PATH],
      players
    );
  }

  async cancelPlayerTransaction(transaction, questionId, playerId) {
    await this.updatePlayersTransaction(transaction, questionId, {
      canceled: arrayUnion({
        playerId,
        timestamp: Timestamp.now(),
      }),
      buzzed: arrayRemove(playerId),
    });
  }

  // React hooks
  useQuestionPlayers(questionId) {
    const { data, loading, error } = this.useDocument([
      questionId,
      ...GameLabellingQuestionRepository.LABELLING_PLAYERS_PATH,
    ]);
    return {
      // players: data ? data.map(p => new Player(p)) : [],
      data,
      loading,
      error,
    };
  }
}
