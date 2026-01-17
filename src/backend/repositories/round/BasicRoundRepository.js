import RoundRepository from '@/backend/repositories/round/RoundRepository';

export default class BasicRoundRepository extends RoundRepository {
  constructor(gameId) {
    super(gameId);
  }
}
