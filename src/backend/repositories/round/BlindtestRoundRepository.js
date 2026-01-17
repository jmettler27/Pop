import BuzzerRoundRepository from '@/backend/repositories/round/BuzzerRoundRepository';

export default class BlindtestRoundRepository extends BuzzerRoundRepository {
    
    constructor(gameId) {
        super(gameId);
    }

} 