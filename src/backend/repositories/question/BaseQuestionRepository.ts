import { Transaction } from 'firebase-admin/firestore';

import FirebaseRepository from '@/backend/repositories/FirebaseRepository';
import { BaseQuestionData, UpdateBaseQuestionData, type CreateBaseQuestionData } from '@/models/questions/question';
import { type QuestionType } from '@/models/questions/question-type';
import QuestionFactory, { type AnyBaseQuestion } from '@/models/questions/QuestionFactory';

export default class BaseQuestionRepository extends FirebaseRepository {
  public readonly questionType: QuestionType;

  constructor(questionType: QuestionType) {
    super('questions');
    this.questionType = questionType;
  }

  async getQuestion(questionId: string): Promise<AnyBaseQuestion | null> {
    const result = await super.get(questionId);
    return result ? QuestionFactory.createBaseQuestion(result.type as QuestionType, result) : null;
  }

  async getQuestionTransaction(transaction: Transaction, questionId: string): Promise<AnyBaseQuestion | null> {
    const result = await super.getTransaction(transaction, questionId);
    return result ? QuestionFactory.createBaseQuestion(result.type as QuestionType, result) : null;
  }

  async getQuestionsCreatedBy(userId: string): Promise<AnyBaseQuestion[]> {
    const questions = await super.getByField('createdBy', userId);
    return questions.map((q) => QuestionFactory.createBaseQuestion(q.type as QuestionType, q));
  }

  /**
   * One offset page of approved questions of this repo's type, newest first. Backs the
   * organizer-only question-bank browser (the client no longer queries `questions`
   * directly — production rules deny `list`). Uses the `(type, approved, createdAt DESC)`
   * composite index.
   */
  async listApproved(limit: number, offset: number): Promise<Array<Record<string, unknown>>> {
    const snapshot = await this.collectionRef
      .where('type', '==', this.questionType)
      .where('approved', '==', true)
      .orderBy('createdAt', 'desc')
      .offset(offset)
      .limit(limit)
      .get();
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  }

  async countApproved(): Promise<number> {
    return this.getCount((ref) => ref.where('type', '==', this.questionType).where('approved', '==', true));
  }

  async createQuestionTransaction(
    transaction: Transaction,
    data: CreateBaseQuestionData,
    id: string | null = null
  ): Promise<AnyBaseQuestion> {
    const result = await super.createTransaction(transaction, data, id);
    return QuestionFactory.createBaseQuestion(this.questionType, result as BaseQuestionData);
  }

  async updateQuestionTransaction(
    transaction: Transaction,
    questionId: string,
    data: UpdateBaseQuestionData
  ): Promise<AnyBaseQuestion> {
    const result = await super.updateTransaction(transaction, questionId, data);
    return QuestionFactory.createBaseQuestion(this.questionType, result as BaseQuestionData);
  }
}
