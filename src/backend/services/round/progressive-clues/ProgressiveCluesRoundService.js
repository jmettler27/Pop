import { RoundType } from '@/backend/models/rounds/RoundType';
import BuzzerRoundService from '@/backend/services/round/BuzzerRoundService';

export default class ProgressiveCluesRoundService extends BuzzerRoundService {
  constructor(gameId) {
    super(gameId, RoundType.PROGRESSIVE_CLUES);

    // this.baseQuestionRepo = new BaseProgressiveCluesQuestionRepository();
  }
}
