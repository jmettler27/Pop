import BuzzerRoundService from '@/backend/services/round/BuzzerRoundService';

export default class ImageRoundService extends BuzzerRoundService {
  async calculateMaxPointsTransaction(transaction, round) {
    return round.questions.length * (round.rewardsPerQuestion + round.rewardsForBonus);
  }
}
