import { QuestionType } from '@/backend/models/questions/QuestionType';
import { arrayRemove, arrayUnion, Timestamp } from 'firebase/firestore';
import GameBuzzerQuestionRepository from '@/backend/repositories/question/game/GameBuzzerQuestionRepository';

export default class GameQuoteQuestionRepository extends GameBuzzerQuestionRepository {
  static QUOTE_PLAYERS_PATH = ['realtime', 'players'];

  constructor(gameId, roundId) {
    super(gameId, roundId, QuestionType.QUOTE);
  }

  // Firestore operations
  async getPlayersTransaction(transaction, questionId) {
    const data = await this.getTransaction(transaction, [
      questionId,
      ...GameQuoteQuestionRepository.QUOTE_PLAYERS_PATH,
    ]);
    // return data ? data.map(p => new Player(p)) : [];
    return data;
  }

  async createQuestionTransaction(transaction, questionId, managerId, data) {
    await super.createQuestionTransaction(transaction, questionId, managerId, data);
    await this.createTransaction(transaction, { buzzed: [], canceled: [] }, [
      questionId,
      ...GameQuoteQuestionRepository.QUOTE_PLAYERS_PATH,
    ]);
  }

  async updateQuestionRevealedElementsTransaction(transaction, questionId, revealed) {
    await this.updateQuestionTransaction(transaction, questionId, {
      revealed,
    });
  }

  async updateQuestionWinnerTransaction(transaction, questionId, playerId, teamId) {
    await this.updateTransaction(transaction, [questionId, ...GameQuoteQuestionRepository.QUOTE_PLAYERS_PATH], {
      winner: { playerId, teamId },
    });
  }

  async resetPlayersTransaction(transaction, questionId) {
    await this.setTransaction(transaction, [questionId, ...GameQuoteQuestionRepository.QUOTE_PLAYERS_PATH], {
      buzzed: [],
      canceled: [],
    });
  }

  async cancelPlayerTransaction(transaction, questionId, playerId) {
    await this.updateTransaction(transaction, [questionId, ...GameQuoteQuestionRepository.QUOTE_PLAYERS_PATH], {
      canceled: arrayUnion({
        playerId,
        timestamp: Timestamp.now(),
      }),
      buzzed: arrayRemove(playerId),
    });
  }

  async clearBuzzedPlayersTransaction(transaction, questionId) {
    await this.updateTransaction(transaction, [questionId, ...GameQuoteQuestionRepository.QUOTE_PLAYERS_PATH], {
      buzzed: [],
    });
  }

  async cancelPlayerTransaction(transaction, questionId, playerId) {
    await this.updateTransaction(transaction, [questionId, ...GameQuoteQuestionRepository.QUOTE_PLAYERS_PATH], {
      canceled: arrayUnion({
        playerId,
        timestamp: Timestamp.now(),
      }),
      buzzed: arrayRemove(playerId),
    });
  }

  // React hooks
  useQuestionPlayers(questionId) {
    const { data, loading, error } = this.useDocument([questionId, ...GameQuoteQuestionRepository.QUOTE_PLAYERS_PATH]);
    return {
      // players: data ? data.map(p => new Player(p)) : [],
      data,
      loading,
      error,
    };
  }
}
