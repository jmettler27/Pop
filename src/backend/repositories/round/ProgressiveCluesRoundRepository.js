import BuzzerRoundRepository from '@/backend/repositories/round/BuzzerRoundRepository';

export default class ProgressiveCluesRoundRepository extends BuzzerRoundRepository {
  constructor(gameId) {
    super(gameId);
  }
}
