import RoundRepository from '@/backend/repositories/round/RoundRepository';

export default class QuoteRoundRepository extends RoundRepository {
  constructor(gameId) {
    super(gameId);
  }
}
