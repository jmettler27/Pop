import GameQuestionRepositoryFactory from '@/backend/repositories/question/game/GameQuestionRepositoryFactory';
import RoundService from '@/backend/services/round/RoundService';
import { RoundType } from '@/backend/models/rounds/RoundType';

export default class MixedRoundService extends RoundService {
  constructor(gameId) {
    super(gameId, RoundType.MIXED);
  }

  async calculateMaxPointsTransaction(transaction, round) {
    return round.questions.length * round.rewardsPerQuestion;
  }
}
