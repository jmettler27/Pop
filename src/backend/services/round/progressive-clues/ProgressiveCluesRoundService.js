import BuzzerRoundService from '@/backend/services/round/BuzzerRoundService';
import { RoundType } from '@/backend/models/rounds/RoundType';

export default class ProgressiveCluesRoundService extends BuzzerRoundService {
  constructor(gameId) {
    super(gameId, RoundType.PROGRESSIVE_CLUES);

    // this.baseQuestionRepo = new BaseProgressiveCluesQuestionRepository();
  }
}
