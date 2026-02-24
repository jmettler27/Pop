import { PlayerStatus } from '@/backend/models/users/Player';

import RoundService from '@/backend/services/round/RoundService';
import GameOddOneOutQuestionRepository from '@/backend/repositories/question/game/GameOddOneOutQuestionRepository';
import { RoundType } from '@/backend/models/rounds/RoundType';

export default class ReorderingRoundService extends RoundService {
  constructor(gameId) {
    super(gameId, RoundType.REORDERING);
  }

  async calculateMaxPointsTransaction(transaction, round) {
    return round.questions.length * round.rewardsPerQuestion;
  }
}
