import RoundRepository from '@/backend/repositories/round/RoundRepository';

export default class ReorderingRoundRepository extends RoundRepository {
    
    constructor(gameId) {
        super(gameId);
    }

    // Add any ReorderingRound specific methods here
} 