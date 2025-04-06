import RoundRepository from '@/backend/repositories/round/RoundRepository';

export default class OddOneOutRoundRepository extends RoundRepository {
    
    constructor(gameId) {
        super(gameId);
    }

    // Add any OddOneOutRound specific methods here
} 