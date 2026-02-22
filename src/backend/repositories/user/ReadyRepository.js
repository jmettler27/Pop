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

  async resetReadyTransaction(transaction) {
    await this.updateTransaction(transaction, { numReady: 0 });
  }

  async incrementReadyTransaction(transaction) {
    await this.updateTransaction(transaction, { numReady: increment(1) });
  }

  async updateNumReadyTransaction(transaction, numReady) {
    await this.updateTransaction(transaction, { numReady });
  }

  // React hooks
  useReady() {
    const { data, loading, error } = this.useDocument();
    return { ready: data, readyLoading: loading, readyError: error };
  }
}
