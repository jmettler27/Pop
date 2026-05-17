import { arrayUnion, Timestamp, type Transaction } from 'firebase/firestore';

import GameQuestionRepository from '@/backend/repositories/question/GameQuestionRepository';
import {
  ColumnIndices,
  CorrectMatch,
  CorrectMatches,
  IncorrectMatch,
  IncorrectMatches,
  PartiallyCorrectMatch,
  PartiallyCorrectMatches,
  type GameMatchingQuestion,
} from '@/models/questions/matching';
import { QuestionType } from '@/models/questions/question-type';

export default class GameMatchingQuestionRepository extends GameQuestionRepository {
  static CORRECT_MATCHES_PATH = ['realtime', 'correct'];
  static INCORRECT_MATCHES_PATH = ['realtime', 'incorrect'];
  static PARTIALLY_CORRECT_MATCHES_PATH = ['realtime', 'partiallyCorrect'];

  constructor(gameId: string, roundId: string) {
    super(gameId, roundId, QuestionType.MATCHING);
  }

  async getCorrectMatchesTransaction(transaction: Transaction, questionId: string): Promise<CorrectMatch[]> {
    const result = (await this.getTransaction(transaction, [
      questionId,
      ...GameMatchingQuestionRepository.CORRECT_MATCHES_PATH,
    ])) as CorrectMatches | null;
    return result ? (result.correctMatches as CorrectMatch[]) : [];
  }

  async addCorrectMatchTransaction(
    transaction: Transaction,
    questionId: string,
    matchIdx: number,
    userId: string,
    teamId: string
  ): Promise<void> {
    await this.updateTransaction(transaction, [questionId, ...GameMatchingQuestionRepository.CORRECT_MATCHES_PATH], {
      correctMatches: arrayUnion({ matchIdx, userId, teamId, timestamp: Timestamp.now() }),
    });
  }

  async getPartiallyCorrectMatchesTransaction(
    transaction: Transaction,
    questionId: string
  ): Promise<PartiallyCorrectMatch[]> {
    const result = (await this.getTransaction(transaction, [
      questionId,
      ...GameMatchingQuestionRepository.PARTIALLY_CORRECT_MATCHES_PATH,
    ])) as PartiallyCorrectMatches | null;
    return result ? (result.partiallyCorrectMatches as PartiallyCorrectMatch[]) : [];
  }

  async addPartiallyCorrectMatchTransaction(
    transaction: Transaction,
    questionId: string,
    colIndices: number[],
    matchIdx: number,
    userId: string,
    teamId: string
  ): Promise<void> {
    await this.updateTransaction(
      transaction,
      [questionId, ...GameMatchingQuestionRepository.PARTIALLY_CORRECT_MATCHES_PATH],
      {
        partiallyCorrectMatches: arrayUnion({ colIndices, matchIdx, userId, teamId, timestamp: Timestamp.now() }),
      }
    );
  }

  async getIncorrectMatchesTransaction(transaction: Transaction, questionId: string): Promise<IncorrectMatch[]> {
    const result = (await this.getTransaction(transaction, [
      questionId,
      ...GameMatchingQuestionRepository.INCORRECT_MATCHES_PATH,
    ])) as IncorrectMatches | null;
    return result ? (result.incorrectMatches as IncorrectMatch[]) : [];
  }

  async addIncorrectMatchTransaction(
    transaction: Transaction,
    questionId: string,
    match: ColumnIndices,
    userId: string,
    teamId: string
  ): Promise<void> {
    await this.updateTransaction(transaction, [questionId, ...GameMatchingQuestionRepository.INCORRECT_MATCHES_PATH], {
      incorrectMatches: arrayUnion({ match, userId, teamId, timestamp: Timestamp.now() }),
    });
  }

  async createQuestionTransaction(
    transaction: Transaction,
    questionId: string,
    managerId: string,
    data: Record<string, unknown>
  ): Promise<GameMatchingQuestion> {
    const result = await super.createQuestionTransaction(transaction, questionId, managerId, data);
    await this.createTransaction(transaction, { correctMatches: {} }, [
      questionId,
      ...GameMatchingQuestionRepository.CORRECT_MATCHES_PATH,
    ]);
    await this.createTransaction(transaction, { incorrectMatches: {} }, [
      questionId,
      ...GameMatchingQuestionRepository.INCORRECT_MATCHES_PATH,
    ]);
    await this.createTransaction(transaction, { partiallyCorrectMatches: {} }, [
      questionId,
      ...GameMatchingQuestionRepository.PARTIALLY_CORRECT_MATCHES_PATH,
    ]);
    return result as GameMatchingQuestion;
  }

  async deleteQuestionTransaction(transaction: Transaction, questionId: string): Promise<void> {
    await super.deleteQuestionTransaction(transaction, questionId);
    await this.deleteTransaction(transaction, [questionId, ...GameMatchingQuestionRepository.CORRECT_MATCHES_PATH]);
    await this.deleteTransaction(transaction, [questionId, ...GameMatchingQuestionRepository.INCORRECT_MATCHES_PATH]);
    await this.deleteTransaction(transaction, [
      questionId,
      ...GameMatchingQuestionRepository.PARTIALLY_CORRECT_MATCHES_PATH,
    ]);
  }

  async resetQuestionTransaction(transaction: Transaction, questionId: string): Promise<void> {
    await this.updateQuestionTransaction(transaction, questionId, { teamNumMistakes: {}, canceled: [] });
    await this.setTransaction(transaction, [questionId, ...GameMatchingQuestionRepository.CORRECT_MATCHES_PATH], {
      correctMatches: [],
    });
    await this.setTransaction(transaction, [questionId, ...GameMatchingQuestionRepository.INCORRECT_MATCHES_PATH], {
      incorrectMatches: [],
    });
    await this.setTransaction(
      transaction,
      [questionId, ...GameMatchingQuestionRepository.PARTIALLY_CORRECT_MATCHES_PATH],
      { partiallyCorrectMatches: [] }
    );
  }

  useCorrectMatches(questionId: string) {
    const { data, loading, error } = this.useDocument([
      questionId,
      ...GameMatchingQuestionRepository.CORRECT_MATCHES_PATH,
    ]);
    return { correctMatches: data ? data.correctMatches : [], loading, error };
  }

  useIncorrectMatches(questionId: string) {
    const { data, loading, error } = this.useDocument([
      questionId,
      ...GameMatchingQuestionRepository.INCORRECT_MATCHES_PATH,
    ]);
    return { incorrectMatches: data ? data.incorrectMatches : [], loading, error };
  }

  usePartiallyCorrectMatches(questionId: string) {
    const { data, loading, error } = this.useDocument([
      questionId,
      ...GameMatchingQuestionRepository.PARTIALLY_CORRECT_MATCHES_PATH,
    ]);
    return { partiallyCorrectMatches: data ? data.partiallyCorrectMatches : [], loading, error };
  }

  useIsCanceled(questionId: string, teamId: string) {
    const { gameQuestion, loading, error } = this.useQuestion(questionId);
    if (loading || error) return { isCanceled: false, loading, error };
    const q = gameQuestion as GameMatchingQuestion | null;
    return {
      isCanceled: q
        ? (q.teamNumMistakes as Record<string, number>)[teamId] >=
          (q.constructor as typeof GameMatchingQuestion).MAX_NUM_MISTAKES
        : false,
      loading,
      error,
    };
  }
}
