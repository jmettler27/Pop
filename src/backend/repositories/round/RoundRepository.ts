import { FieldValue, type Transaction } from 'firebase-admin/firestore';

import { logger } from '@/backend/logger';
import FirebaseRepository, { type QueryOptions } from '@/backend/repositories/FirebaseRepository';
import { CreateRoundData, RoundData } from '@/models/rounds/round';
import { type RoundType } from '@/models/rounds/round-type';
import RoundFactory, { type AnyRound } from '@/models/rounds/RoundFactory';

const log = logger.child({ module: 'RoundRepository' });

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
      log.error({ err: error }, 'Failed to create the round');
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
    await this.updateRoundTransaction(transaction, roundId, { questions: FieldValue.arrayUnion(questionId) });
  }

  async removeQuestionTransaction(transaction: Transaction, roundId: string, questionId: string): Promise<void> {
    await this.updateRoundTransaction(transaction, roundId, { questions: FieldValue.arrayRemove(questionId) });
  }

  async startRoundTransaction(transaction: Transaction, roundId: string): Promise<void> {
    await this.updateRoundTransaction(transaction, roundId, { dateStart: FieldValue.serverTimestamp() });
  }

  async endRoundTransaction(transaction: Transaction, roundId: string): Promise<void> {
    await this.updateRoundTransaction(transaction, roundId, { dateEnd: FieldValue.serverTimestamp() });
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
}
