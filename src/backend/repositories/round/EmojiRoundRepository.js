import BuzzerRoundRepository from '@/backend/repositories/round/BuzzerRoundRepository';

export default class EmojiRoundRepository extends BuzzerRoundRepository {
  constructor(gameId) {
    super(gameId);
  }
}
