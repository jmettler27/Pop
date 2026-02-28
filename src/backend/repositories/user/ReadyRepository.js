import FirebaseDocumentRepository from '@/backend/repositories/FirebaseDocumentRepository';

import { increment } from 'firebase/firestore';

export default class ReadyRepository extends FirebaseDocumentRepository {
  constructor(gameId) {
    super(['games', gameId, 'realtime', 'ready']);
  }

  // Firestore operations
  async initializeReadyTransaction(transaction) {
    return await super.setTransaction(transaction, { numPlayers: 0, numReady: 0 });
  }

  async updateReadyTransaction(transaction, data) {
    return await super.updateTransaction(transaction, data);
  }

  async resetReadyTransaction(transaction) {
    await this.updateReadyTransaction(transaction, { numReady: 0 });
  }

  async incrementReadyTransaction(transaction) {
    await this.updateReadyTransaction(transaction, { numReady: increment(1) });
  }

  async updateNumReadyTransaction(transaction, numReady) {
    await this.updateReadyTransaction(transaction, { numReady });
  }

  // React hooks
  useReady() {
    const { data, loading, error } = this.useDocument();
    return { ready: data, readyLoading: loading, readyError: error };
  }
}
