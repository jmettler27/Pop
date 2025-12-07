import FirebaseDocumentRepository from '@/backend/repositories/FirebaseDocumentRepository';

export default class ChooserRepository extends FirebaseDocumentRepository {
    constructor(gameId) {
        super(['games', gameId, 'realtime', 'states']);
    }

    // Firestore operations
    async getChooserTransaction(transaction) {
        return this.getTransaction(transaction);
    }

    async getChooserIdTransaction(transaction) {
        const { chooserOrder, chooserIdx } = await this.getChooserTransaction(transaction);
        return chooserOrder[chooserIdx];
    }

    async resetChoosers() {
        return await this.update({
            chooserIdx: 0
        });
    }

    async resetChoosersTransaction(transaction) {
        return await this.updateTransaction(transaction, {
            chooserIdx: 0
        });
    }

    async initializeChoosersTransaction(transaction, chooserOrder) {
        return await this.setTransaction(transaction, {
            chooserIdx: 0,
            chooserOrder,
        });
    }

    async updateChooserTransaction(transaction, data) {
        return await this.updateTransaction(transaction, {
            chooserIdx: data.chooserIdx,
            chooserOrder: data.chooserOrder
        });
    }

    async updateChooserOrderTransaction(transaction, order) {
        return await this.updateTransaction(transaction, {
            chooserOrder: order
        });
    }

    async updateChooserIndexTransaction(transaction, chooserIdx) {
        return await this.updateTransaction(transaction, {
            chooserIdx
        });
    }

    async switchChooserTransaction(transaction) {
        const { chooserOrder, chooserIdx } = await this.getChooserTransaction(transaction);
        const newChooserIdx = (chooserIdx + 1) % chooserOrder.length;
        const newChooserTeamId = chooserOrder[newChooserIdx];

        await this.updateTransaction(transaction, {
            chooserIdx: newChooserIdx,
        });

        return newChooserTeamId;
    }

    async createChooserTransaction(transaction) {
        return await this.createTransaction(transaction, {});
    }
    
    
    // React hooks
    useChooser() {
        const { data, loading, error } = super.useDocument();
        return { chooser: data, loading, error };
    }

    useCurrentChooser() {
        const { chooser, loading, error } = this.useChooser();
        
        if (loading || error || !chooser) {
            return { 
                currentChooserTeamId: null, 
                loading, 
                error 
            };
        }

        return {
            currentChooserTeamId: chooser.chooserOrder[chooser.chooserIdx],
            loading,
            error
        };
    }

    useIsChooser(teamId) {
        const { currentChooserTeamId, loading, error } = this.useCurrentChooser();

        if (loading || error) {
            return { isChooser: false, loading, error };
        }

        return {
            isChooser: teamId === currentChooserTeamId,
            loading,
            error
        };
    }


}
