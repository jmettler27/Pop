import BuzzerRoundService from '@/backend/services/round/BuzzerRoundService';
import { RoundType } from '@/models/rounds/round-type';

export default class ProgressiveCluesRoundService extends BuzzerRoundService {
  constructor(gameId: string) {
    super(gameId, RoundType.PROGRESSIVE_CLUES);
  }
}
