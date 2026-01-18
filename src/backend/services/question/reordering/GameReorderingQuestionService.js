import GameQuestionService from '@/backend/services/question/GameQuestionService';
import {QuestionType} from '@/backend/models/questions/QuestionType';
import {runTransaction} from "firebase/firestore";
import {firestore} from "@/backend/firebase/firebase";

export default class GameReorderingQuestionService extends GameQuestionService {
  constructor(gameId, roundId) {
    super(gameId, roundId, QuestionType.REORDERING);
  }

  async resetQuestionTransaction(transaction, questionId) {
    await super.resetQuestionTransaction(transaction, questionId);

    console.log(
      'Reordering question successfully reset',
      'game',
      this.gameId,
      'round',
      this.roundId,
      'question',
      questionId
    );
  }

  async endQuestionTransaction(transaction, questionId) {
    await super.endQuestionTransaction(transaction, questionId);

    console.log(
      'Reordering question successfully ended',
      'game',
      this.gameId,
      'round',
      this.roundId,
      'question',
      questionId
    );
  }

  async handleCountdownEndTransaction(transaction, questionId) {
    await super.handleCountdownEndTransaction(transaction, questionId);

    console.log('Reordering question countdown end successfully handled', questionId);
  }

  /* =============================================================================================================== */

  async submitOrdering(questionId, playerId, teamId, ordering) {
    if (!questionId) {
      throw new Error('No question ID has been provided!');
    }

    if (!playerId) {
      throw new Error('No player ID has been provided!');
    }

    if (!teamId) {
      throw new Error('No team ID has been provided!');
    }

    if (!ordering) {
      throw new Error('No ordering has been provided!');
    }

    try {
      await runTransaction(firestore, async (transaction) => {
        console.log('Ordering submitted successfully', questionId, playerId, teamId, ordering);
      });
    } catch (error) {
      console.error('Failed to submit the ordering:', error);
      throw error;
    }
  }
}
