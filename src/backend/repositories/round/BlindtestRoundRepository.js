import RiddleRoundRepository from '@/backend/repositories/round/RiddleRoundRepository';

export default class BlindtestRoundRepository extends RiddleRoundRepository {
    
    constructor(gameId) {
        super(gameId);
    }

} 