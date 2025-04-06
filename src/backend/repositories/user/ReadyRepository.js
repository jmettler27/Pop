import FirebaseDocumentRepository from '@/backend/repositories/FirebaseDocumentRepository';

import { increment } from 'firebase/firestore';

export default class ReadyRepository extends FirebaseDocumentRepository {

    constructor(gameId) {
        super(['games', gameId, 'realtime', 'ready']);
    }

    // Firestore operations
    async getReadyTransaction(transaction) {
        return this.getTransaction(transaction);
    }

    async resetReady() {
        await this.update({ numReady: 0 });
    }

    async resetReadyTransaction(transaction) {
        await this.updateTransaction(transaction, { numReady: 0 });
    }

    async initializeReadyTransaction(transaction) {
        return await super.setTransaction(transaction, { numPlayers: 0, numReady: 0 });
    }

    async incrementReady() {
        await this.update({ numReady: increment(1) });
    }

    async incrementReadyTransaction(transaction) {
        await this.updateTransaction(transaction, { numReady: increment(1) });
    }


    // React hooks
    useReady() {
        const { data, loading, error } = this.useDocument();
        return { ready: data, readyLoading: loading, readyError: error };
    }
    
    
}
