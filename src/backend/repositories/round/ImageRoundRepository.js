import BuzzerRoundRepository from '@/backend/repositories/round/BuzzerRoundRepository';

export default class ImageRoundRepository extends BuzzerRoundRepository {
  constructor(gameId) {
    super(gameId);
  }
}
