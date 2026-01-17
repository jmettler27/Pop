import RoundRepository from '@/backend/repositories/round/RoundRepository';

export default class MixedRoundRepository extends RoundRepository {
  constructor(gameId) {
    super(gameId);
  }
}
