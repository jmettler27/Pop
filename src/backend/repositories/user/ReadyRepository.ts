import { increment, type Transaction } from 'firebase/firestore';

import FirebaseDocumentRepository from '@/backend/repositories/FirebaseDocumentRepository';
import { Ready } from '@/models/ready';

export default class ReadyRepository extends FirebaseDocumentRepository {
  constructor(gameId: string) {
    super(['games', gameId, 'realtime', 'ready']);
  }

  async getReadyTransaction(transaction: Transaction): Promise<Ready | null> {
    const result = super.getTransaction(transaction);
    return result ? (result as unknown as Ready) : null;
  }

  async initializeReadyTransaction(transaction: Transaction): Promise<void> {
    await super.setTransaction(transaction, { numPlayers: 0, numReady: 0 });
  }

  async updateReadyTransaction(transaction: Transaction, data: Record<string, unknown>): Promise<void> {
    await super.updateTransaction(transaction, data);
  }

  async resetReadyTransaction(transaction: Transaction): Promise<void> {
    await this.updateReadyTransaction(transaction, { numReady: 0 });
  }

  async incrementReadyTransaction(transaction: Transaction): Promise<void> {
    await this.updateReadyTransaction(transaction, { numReady: increment(1) });
  }

  async updateNumReadyTransaction(transaction: Transaction, numReady: number): Promise<void> {
    await this.updateReadyTransaction(transaction, { numReady });
  }

  useReady() {
    const { data, loading, error } = this.useDocument();
    return { ready: data, readyLoading: loading, readyError: error };
  }
}
