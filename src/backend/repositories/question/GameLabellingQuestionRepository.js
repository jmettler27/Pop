import GameQuestionRepository from '@/backend/repositories/question/GameQuestionRepository';

import { QuestionType } from '@/backend/models/questions/QuestionType';
import { arrayRemove, arrayUnion, Timestamp } from 'firebase/firestore';
import GameBuzzerQuestionRepository from '@/backend/repositories/question/GameBuzzerQuestionRepository';

export default class GameLabellingQuestionRepository extends GameBuzzerQuestionRepository {
  constructor(gameId, roundId) {
    super(gameId, roundId, QuestionType.LABELLING);
  }

  // async getPlayersTransaction(transaction, questionId) {
  //   return await this.getTransaction(transaction, [
  //     questionId,
  //     ...GameBuzzerQuestionRepository.BUZZER_PLAYERS_PATH,
  //   ]);
  // }

  // async createQuestionTransaction(transaction, questionId, managerId, data) {
  //   await super.createQuestionTransaction(transaction, questionId, managerId, data);
  //   await this.createTransaction(
  //     transaction,
  //     {
  //       buzzed: [],
  //       canceled: [],
  //     },
  //     [questionId, ...GameBuzzerQuestionRepository.BUZZER_PLAYERS_PATH]
  //   );
  // }

  async updateQuestionRevealedElementsTransaction(transaction, questionId, revealed) {
    await this.updateQuestionTransaction(transaction, questionId, {
      revealed,
    });
  }

  // async resetPlayersTransaction(transaction, questionId) {
  //   await this.setTransaction(transaction, [questionId, ...GameBuzzerQuestionRepository.BUZZER_PLAYERS_PATH], {
  //     buzzed: [],
  //     canceled: [],
  //   });
  // }

  // async updatePlayersTransaction(transaction, questionId, players) {
  //   await this.updateTransaction(
  //     transaction,
  //     [questionId, ...GameLabellingQuestionRepository.BUZZER_PLAYERS_PATH],
  //     players
  //   );
  // }

  // async cancelPlayerTransaction(transaction, questionId, playerId) {
  //   await this.updatePlayersTransaction(transaction, questionId, {
  //     canceled: arrayUnion({
  //       playerId,
  //       timestamp: Timestamp.now(),
  //     }),
  //     buzzed: arrayRemove(playerId),
  //   });
  // }

  // // React hooks
  // useQuestionPlayers(questionId) {
  //   const { data, loading, error } = this.useDocument([
  //     questionId,
  //     ...GameBuzzerQuestionRepository.BUZZER_PLAYERS_PATH,
  //   ]);
  //   return {
  //     // players: data ? data.map(p => new Player(p)) : [],
  //     data,
  //     loading,
  //     error,
  //   };
  // }
}
