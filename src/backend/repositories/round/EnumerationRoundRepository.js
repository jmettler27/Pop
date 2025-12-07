import RoundRepository from '@/backend/repositories/round/RoundRepository';

export default class EnumerationRoundRepository extends RoundRepository {
    
    constructor(gameId) {   
        super(gameId);
    }

} 