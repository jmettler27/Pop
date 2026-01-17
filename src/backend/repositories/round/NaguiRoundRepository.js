import RoundRepository from '@/backend/repositories/round/RoundRepository';

export default class NaguiRoundRepository extends RoundRepository {
  constructor(gameId) {
    super(gameId);
  }

  // Add any NaguiRound specific methods here
}
