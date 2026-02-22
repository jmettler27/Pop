import BuzzerRoundService from '@/backend/services/round/BuzzerRoundService';
import { RoundType } from '@/backend/models/rounds/RoundType';

export default class EmojiRoundService extends BuzzerRoundService {
  constructor(gameId) {
    super(gameId, RoundType.EMOJI);
  }

  async calculateMaxPointsTransaction(transaction, round) {
    return round.questions.length * (round.rewardsPerQuestion + round.rewardsForBonus);
  }
}
