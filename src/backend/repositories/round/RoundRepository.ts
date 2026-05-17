import { arrayRemove, arrayUnion, serverTimestamp, type Transaction } from 'firebase/firestore';

import FirebaseRepository, { type QueryOptions } from '@/backend/repositories/FirebaseRepository';
import { CreateRoundData, Round, RoundData } from '@/models/rounds/round';
import { type RoundType } from '@/models/rounds/round-type';
import RoundFactory, { type AnyRound } from '@/models/rounds/RoundFactory';

export default class RoundRepository extends FirebaseRepository {
  constructor(gameId: string) {
    super(['games', gameId, 'rounds']);
  }

  async getRound(roundId: string): Promise<AnyRound | null> {
    const data = await super.get(roundId);
    return data ? RoundFactory.createRound(data.type as RoundType, data) : null;
  }

  async getRoundTransaction(transaction: Transaction, roundId: string): Promise<AnyRound | null> {
    const data = await super.getTransaction(transaction, roundId);
    return data ? RoundFactory.createRound(data.type as RoundType, data) : null;
  }

  async getAllRounds(): Promise<AnyRound[]> {
    const data = await super.getAll();
    return data.map((r) => RoundFactory.createRound(r.type as RoundType, r));
  }

  async getRounds(queryOptions: QueryOptions = {}): Promise<AnyRound[]> {
    const data = await super.getByQuery(queryOptions);
    return data.map((r) => RoundFactory.createRound(r.type as RoundType, r));
  }

  async getRoundsTransaction(transaction: Transaction, queryOptions: QueryOptions = {}): Promise<AnyRound[]> {
    const data = await super.getByQueryTransaction(transaction, queryOptions);
    return data.map((r) => RoundFactory.createRound(r.type as RoundType, r));
  }

  async createRoundTransaction(
    transaction: Transaction,
    roundType: RoundType,
    data: CreateRoundData
  ): Promise<AnyRound> {
    try {
      const result = await super.createTransaction(transaction, { ...data, type: roundType });
      return RoundFactory.createRound(roundType, result as RoundData);
    } catch (error) {
      console.error('Failed to create the round:', error);
      throw error;
    }
  }

  async updateRound(roundId: string, data: Record<string, unknown>): Promise<void> {
    await super.update(roundId, data);
  }

  async updateRoundTransaction(
    transaction: Transaction,
    roundId: string,
    data: Record<string, unknown>
  ): Promise<void> {
    await super.updateTransaction(transaction, roundId, data);
  }

  async deleteRoundTransaction(transaction: Transaction, roundId: string): Promise<void> {
    await super.deleteTransaction(transaction, roundId);
  }

  async addQuestionTransaction(transaction: Transaction, roundId: string, questionId: string): Promise<void> {
    await this.updateRoundTransaction(transaction, roundId, { questions: arrayUnion(questionId) });
  }

  async removeQuestionTransaction(transaction: Transaction, roundId: string, questionId: string): Promise<void> {
    await this.updateRoundTransaction(transaction, roundId, { questions: arrayRemove(questionId) });
  }

  async startRoundTransaction(transaction: Transaction, roundId: string): Promise<void> {
    await this.updateRoundTransaction(transaction, roundId, { dateStart: serverTimestamp() });
  }

  async endRoundTransaction(transaction: Transaction, roundId: string): Promise<void> {
    await this.updateRoundTransaction(transaction, roundId, { dateEnd: serverTimestamp() });
  }

  async setCurrentQuestionIdxTransaction(
    transaction: Transaction,
    roundId: string,
    questionOrder: number
  ): Promise<void> {
    await this.updateRoundTransaction(transaction, roundId, { currentQuestionIdx: questionOrder });
  }

  async resetRound(roundId: string, roundType: RoundType): Promise<void> {
    await this.updateRound(roundId, {
      type: roundType,
      currentQuestionIdx: 0,
      dateEnd: null,
      dateStart: null,
      order: null,
    });
  }

  async resetRoundTransaction(transaction: Transaction, roundId: string, roundType: RoundType): Promise<void> {
    await this.updateRoundTransaction(transaction, roundId, {
      type: roundType,
      currentQuestionIdx: 0,
      dateEnd: null,
      dateStart: null,
      order: null,
    });
  }

  useRound(roundId: string) {
    const { data, loading, error } = super.useDocument(roundId);
    return { round: data ? RoundFactory.createRound(data.type as RoundType, data) : null, loading, error };
  }

  useRoundOnce(roundId: string) {
    const { data, loading, error } = super.useDocumentOnce(roundId);
    return { round: data ? RoundFactory.createRound(data.type as RoundType, data) : null, loading, error };
  }

  useAllRounds() {
    const { data, loading, error } = super.useCollection();
    return { rounds: data.map((r) => RoundFactory.createRound(r.type as RoundType, r)), loading, error };
  }

  useAllRoundsOnce(queryOptions: QueryOptions = {}) {
    const { data, loading, error } = super.useCollectionOnce(queryOptions);
    return { rounds: data.map((r) => RoundFactory.createRound(r.type as RoundType, r)), loading, error };
  }
}
