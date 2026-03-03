import GameQuestionRepository from '@/backend/repositories/question/GameQuestionRepository';

import { Player } from '@/backend/models/users/Player';
import { Timestamp } from 'firebase/firestore';
import { arrayUnion, arrayRemove } from 'firebase/firestore';

export default class GameBuzzerQuestionRepository extends GameQuestionRepository {
  static BUZZER_PLAYERS_PATH = ['realtime', 'players'];

  constructor(gameId, roundId, questionType) {
    super(gameId, roundId, questionType);
  }

  // Firestore operations
  async getPlayersTransaction(transaction, questionId) {
    return await this.getTransaction(transaction, [questionId, ...GameBuzzerQuestionRepository.BUZZER_PLAYERS_PATH]);
  }

  async createQuestionTransaction(transaction, questionId, managerId, data) {
    await super.createQuestionTransaction(transaction, questionId, managerId, data);

    await this.createTransaction(transaction, { buzzed: [], canceled: [] }, [
      questionId,
      ...GameBuzzerQuestionRepository.BUZZER_PLAYERS_PATH,
    ]);
  }

  async resetQuestionTransaction(transaction, questionId) {
    await this.resetPlayersTransaction(transaction, questionId);
    await this.resetQuestionWinnerTransaction(transaction, questionId);
  }

  async deleteQuestionTransaction(transaction, questionId) {
    await super.deleteQuestionTransaction(transaction, questionId);
    await this.deletePlayersTransaction(transaction, questionId);
  }

  async updateQuestionWinnerTransaction(transaction, questionId, playerId, teamId) {
    await this.updateQuestionTransaction(transaction, questionId, {
      winner: { playerId, teamId },
    });
  }

  async resetQuestionWinnerTransaction(transaction, questionId) {
    await this.updateQuestionTransaction(transaction, questionId, {
      winner: null,
    });
  }

  async updatePlayersTransaction(transaction, questionId, players) {
    await this.updateTransaction(
      transaction,
      [questionId, ...GameBuzzerQuestionRepository.BUZZER_PLAYERS_PATH],
      players
    );
  }

  async deletePlayersTransaction(transaction, questionId) {
    await this.deleteTransaction(transaction, [questionId, ...GameBuzzerQuestionRepository.BUZZER_PLAYERS_PATH]);
  }

  async resetPlayersTransaction(transaction, questionId) {
    await this.setTransaction(transaction, [questionId, ...GameBuzzerQuestionRepository.BUZZER_PLAYERS_PATH], {
      buzzed: [],
      canceled: [],
    });
  }

  async cancelPlayerTransaction(transaction, questionId, playerId, clueIdx = 0) {
    await this.updatePlayersTransaction(transaction, questionId, {
      canceled: arrayUnion({
        clueIdx,
        playerId,
        timestamp: Timestamp.now(),
      }),
      buzzed: arrayRemove(playerId),
    });
  }

  async clearBuzzedPlayersTransaction(transaction, questionId) {
    await this.updateTransaction(transaction, [questionId, ...GameBuzzerQuestionRepository.BUZZER_PLAYERS_PATH], {
      buzzed: [],
    });
  }

  async addPlayerToBuzzerTransaction(transaction, questionId, playerId) {
    await this.updatePlayersTransaction(transaction, questionId, { buzzed: arrayUnion(playerId) });
  }

  async removePlayerFromBuzzerTransaction(transaction, questionId, playerId) {
    await this.updatePlayersTransaction(transaction, questionId, { buzzed: arrayRemove(playerId) });
  }

  async clearBuzzerTransaction(transaction, questionId) {
    await this.updatePlayersTransaction(transaction, questionId, { buzzed: [] });
  }

  // React hooks
  useQuestionPlayers(questionId) {
    const { data, loading, error } = this.useDocument([
      questionId,
      ...GameBuzzerQuestionRepository.BUZZER_PLAYERS_PATH,
    ]);
    return {
      data,
      loading,
      error,
    };
  }
}
