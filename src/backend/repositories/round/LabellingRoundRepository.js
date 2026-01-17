import RoundRepository from '@/backend/repositories/round/RoundRepository';

export default class LabellingRoundRepository extends RoundRepository {
  constructor(gameId) {
    super(gameId);
  }

  // Add any LabellingRound specific methods here
}
