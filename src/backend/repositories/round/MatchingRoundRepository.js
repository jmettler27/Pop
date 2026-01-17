import RoundRepository from '@/backend/repositories/round/RoundRepository';

export default class MatchingRoundRepository extends RoundRepository {
  constructor(gameId) {
    super(gameId);
  }
}
