import FirebaseRepository from '@/backend/repositories/FirebaseRepository';

import QuestionFactory from '@/backend/models/questions/QuestionFactory';

import { serverTimestamp } from 'firebase/firestore';

export default class GameQuestionRepository extends FirebaseRepository {
  constructor(gameId, roundId, questionType) {
    super(['games', gameId, 'rounds', roundId, 'questions']);
    this.questionType = questionType;
  }

  /**
   * Get a game question
   * @param {string} questionId - The ID of the question
   * @returns {GameQuestion}
   */
  async getQuestion(questionId) {
    const data = await super.get(questionId);
    return data ? QuestionFactory.createGameQuestion(this.questionType, data) : null;
  }

  /**
   * Get a game question transaction
   * @param {Transaction} transaction - The transaction
   * @param {string} questionId - The ID of the question
   * @returns {GameQuestion}
   */
  async getQuestionTransaction(transaction, questionId) {
    const data = await super.getTransaction(transaction, questionId);
    return data ? QuestionFactory.createGameQuestion(this.questionType, data) : null;
  }

  /**
   * Get all questions in the round
   * @returns {Promise<GameQuestion[]>} The questions
   */
  async getAllQuestions() {
    const data = await super.getAll();
    return data.map((q) => QuestionFactory.createGameQuestion(q.type, q));
  }

  async resetQuestionTransaction(transaction, questionId) {
    throw new Error('Not implemented');
  }

  async resetAllQuestionsTransaction(transaction) {
    const questions = await this.getAllQuestions();
    await Promise.all(questions.map((q) => this.resetQuestionTransaction(transaction, q.id)));
  }

  /**
   * Create a game question within a transaction
   * @param {Transaction} transaction - The transaction
   * @param {string} questionId - The ID of the question
   * @param {string} managerId - The ID of the manager
   * @param {Object} data - The data of the question
   */
  async createQuestionTransaction(transaction, questionId, managerId, data) {
    try {
      const question = QuestionFactory.createGameQuestion(this.questionType, {
        ...data,
        id: questionId,
        type: this.questionType,
        managedBy: managerId,
      });
      const createData = await super.createTransaction(transaction, question.toObject(), questionId);
      return QuestionFactory.createGameQuestion(this.questionType, createData);
    } catch (error) {
      console.error('Failed to create the question:', error);
      throw error;
    }
  }

  /**
   * Delete a game question within a transaction
   * @param {Transaction} transaction - The transaction
   * @param {string} questionId - The ID of the question
   */
  async deleteQuestionTransaction(transaction, questionId) {
    try {
      await super.deleteTransaction(transaction, questionId);
    } catch (error) {
      console.error('Failed to delete the question:', error);
      throw error;
    }
  }

  /**
   * Update a game question transaction
   * @param {Transaction} transaction - The transaction
   * @param {string} questionId - The ID of the question
   * @param {Object} data - The data of the question
   */
  async updateQuestionTransaction(transaction, questionId, data) {
    await super.updateTransaction(transaction, questionId, data);
  }

  /**
   * Set a game question transaction
   * @param {Transaction} transaction - The transaction
   * @param {string} questionId - The ID of the question
   * @param {Object} data - The data of the question
   * @returns {GameQuestion}
   */
  async setQuestionTransaction(transaction, questionId, data) {
    const setData = await this.setTransaction(transaction, questionId, data);
    return setData ? QuestionFactory.createGameQuestion(this.questionType, setData) : null;
  }

  async startQuestionTransaction(transaction, questionId) {
    return this.updateQuestionTransaction(transaction, questionId, {
      dateStart: serverTimestamp(),
    });
  }

  async endQuestionTransaction(transaction, questionId) {
    return this.updateQuestionTransaction(transaction, questionId, {
      dateEnd: serverTimestamp(),
    });
  }

  async updateQuestionWinnerTransaction(transaction, questionId, playerId, teamId) {
    return this.updateQuestionTransaction(transaction, questionId, {
      winner: {
        playerId,
        teamId,
      },
    });
  }

  async resetQuestionWinnerTransaction(transaction, questionId) {
    return this.updateQuestionTransaction(transaction, questionId, {
      winner: null,
    });
  }

  /**
   * Use a game question
   * @returns {GameQuestion}
   */
  useQuestion(questionId) {
    const { data, loading, error } = super.useDocument(questionId);
    return {
      gameQuestion: data ? QuestionFactory.createGameQuestion(this.questionType, data) : null,
      loading: loading,
      error: error,
    };
  }

  /**
   * Use a game question once
   * @returns {GameQuestion}
   */
  useQuestionOnce(questionId) {
    const { data, loading, error } = super.useDocumentOnce(questionId);
    return {
      gameQuestion: data ? QuestionFactory.createGameQuestion(this.questionType, data) : null,
      loading: loading,
      error: error,
    };
  }
}
