import { query, Transaction, where } from 'firebase/firestore';

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

  async createQuestionTransaction(transaction: Transaction, data: CreateBaseQuestionData): Promise<AnyBaseQuestion> {
    const result = await super.createTransaction(transaction, data);
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

  // Total count of questions of this type, for the "Page X of Y" indicator — a Firestore count()
  // aggregation, billed as a single read regardless of how many questions match. Plain async method
  // (not a hook), see FirebaseRepository.getCount; pair with useFirestoreCount from a client component.
  getQuestionsCount(approved: boolean): Promise<number> {
    return super.getCount((ref) =>
      query(ref, where('type', '==', this.questionType), where('approved', '==', approved))
    );
  }
}
