import RoundRepository from '@/backend/repositories/round/RoundRepository';

export default class MCQRoundRepository extends RoundRepository {
    
    constructor(gameId) {
        super(gameId);
    }

    // Add any MCQRound specific methods here
} 