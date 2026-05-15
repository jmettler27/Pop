import { serverTimestamp, type Transaction } from 'firebase/firestore';

import FirebaseRepository from '@/backend/repositories/FirebaseRepository';
import { type QuestionType } from '@/models/questions/question-type';
import QuestionFactory, { type AnyGameQuestion } from '@/models/questions/QuestionFactory';

export default class GameQuestionRepository extends FirebaseRepository {
  protected questionType: QuestionType;

  constructor(gameId: string, roundId: string, questionType: QuestionType) {
    super(['games', gameId, 'rounds', roundId, 'questions']);
    this.questionType = questionType;
  }

  async getQuestion(questionId: string): Promise<AnyGameQuestion | null> {
    const data = await super.get(questionId);
    return data ? QuestionFactory.createGameQuestion(this.questionType, data) : null;
  }

  async getQuestionTransaction(transaction: Transaction, questionId: string): Promise<AnyGameQuestion | null> {
    const data = await super.getTransaction(transaction, questionId);
    return data ? QuestionFactory.createGameQuestion(this.questionType, data) : null;
  }

  async getAllQuestions(): Promise<AnyGameQuestion[]> {
    const data = await super.getAll();
    return data.map((q) => QuestionFactory.createGameQuestion(q.type as QuestionType, q));
  }

  async resetQuestionTransaction(_transaction: Transaction, _questionId: string): Promise<void> {
    throw new Error('Not implemented');
  }

  async resetAllQuestionsTransaction(transaction: Transaction): Promise<void> {
    const questions = await this.getAllQuestions();
    await Promise.all(questions.map((q) => this.resetQuestionTransaction(transaction, q.id!)));
  }

  async createQuestionTransaction(
    transaction: Transaction,
    questionId: string,
    managerId: string,
    data: Record<string, unknown>
  ): Promise<AnyGameQuestion> {
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

  async deleteQuestionTransaction(transaction: Transaction, questionId: string): Promise<void> {
    try {
      await super.deleteTransaction(transaction, questionId);
    } catch (error) {
      console.error('Failed to delete the question:', error);
      throw error;
    }
  }

  async updateQuestionTransaction(
    transaction: Transaction,
    questionId: string,
    data: Record<string, unknown>
  ): Promise<void> {
    await super.updateTransaction(transaction, questionId, data);
  }

  async setQuestionTransaction(
    transaction: Transaction,
    questionId: string,
    data: Record<string, unknown>
  ): Promise<AnyGameQuestion | null> {
    const setData = await this.setTransaction(transaction, questionId, data);
    return setData ? QuestionFactory.createGameQuestion(this.questionType, setData) : null;
  }

  async startQuestionTransaction(transaction: Transaction, questionId: string): Promise<void> {
    return this.updateQuestionTransaction(transaction, questionId, { dateStart: serverTimestamp() });
  }

  async endQuestionTransaction(transaction: Transaction, questionId: string): Promise<void> {
    return this.updateQuestionTransaction(transaction, questionId, { dateEnd: serverTimestamp() });
  }

  async updateQuestionWinnerTransaction(
    transaction: Transaction,
    questionId: string,
    playerId: string,
    teamId: string
  ): Promise<void> {
    return this.updateQuestionTransaction(transaction, questionId, { winner: { playerId, teamId } });
  }

  async resetQuestionWinnerTransaction(transaction: Transaction, questionId: string): Promise<void> {
    return this.updateQuestionTransaction(transaction, questionId, { winner: null });
  }

  useQuestion(questionId: string) {
    const { data, loading, error } = super.useDocument(questionId);
    return {
      gameQuestion: data ? (QuestionFactory.createGameQuestion(this.questionType, data) as AnyGameQuestion) : null,
      loading,
      error,
    };
  }

  useQuestionOnce(questionId: string) {
    const { data, loading, error } = super.useDocumentOnce(questionId);
    return {
      gameQuestion: data ? (QuestionFactory.createGameQuestion(this.questionType, data) as AnyGameQuestion) : null,
      loading,
      error,
    };
  }
}
