import GameQuestionRepository from '@/backend/repositories/question/game/GameQuestionRepository';

import { QuestionType } from '@/backend/models/questions/QuestionType';
import { increment, serverTimestamp, Timestamp } from 'firebase/firestore';
import { EnumerationQuestionStatus } from '@/backend/models/questions/Enumeration';

export default class GameEnumerationQuestionRepository extends GameQuestionRepository {
  static ENUMERATION_PLAYERS_PATH = ['realtime', 'players'];

  constructor(gameId, roundId) {
    super(gameId, roundId, QuestionType.ENUMERATION);
  }

  // Firestore operations
  async resetQuestionTransaction(transaction, questionId) {
    await this.setPlayersTransaction(transaction, questionId, {
      bets: [],
    });

    await this.updateQuestionTransaction(transaction, questionId, {
      status: EnumerationQuestionStatus.REFLECTION,
      winner: null,
    });
  }

  async getPlayersTransaction(transaction, questionId) {
    const data = await this.getTransaction(transaction, [
      questionId,
      ...GameEnumerationQuestionRepository.ENUMERATION_PLAYERS_PATH,
    ]);
    // return data ? data.map(p => new Player(p)) : [];
    return data;
  }

  async setPlayersTransaction(transaction, questionId, data) {
    await this.setTransaction(
      transaction,
      [questionId, ...GameEnumerationQuestionRepository.ENUMERATION_PLAYERS_PATH],
      data
    );
  }

  async addBetTransaction(transaction, questionId, playerId, teamId, bet) {
    await this.updateTransaction(
      transaction,
      [questionId, ...GameEnumerationQuestionRepository.ENUMERATION_PLAYERS_PATH],
      {
        bets: arrayUnion({
          playerId,
          teamId,
          bet,
          timestamp: Timestamp.now(),
        }),
      }
    );
  }

  async incrementValidItemsTransaction(transaction, questionId) {
    await this.updateTransaction(
      transaction,
      [questionId, ...GameEnumerationQuestionRepository.ENUMERATION_PLAYERS_PATH],
      {
        ['challenger.numCorrect']: increment(1),
      }
    );
  }

  async validateItemTransaction(transaction, questionId, itemIdx) {
    await this.updateTransaction(
      transaction,
      [questionId, ...GameEnumerationQuestionRepository.ENUMERATION_PLAYERS_PATH],
      {
        ['challenger.numCorrect']: increment(1),
        [`challenger.cited.${itemIdx}`]: serverTimestamp(),
      }
    );
  }

  // React hooks
  useQuestionPlayers(questionId) {
    const { data, loading, error } = this.useDocument([
      questionId,
      ...GameEnumerationQuestionRepository.ENUMERATION_PLAYERS_PATH,
    ]);
    return {
      // players: data ? data.map(p => new Player(p)) : [],
      data,
      loading,
      error,
    };
  }
}
