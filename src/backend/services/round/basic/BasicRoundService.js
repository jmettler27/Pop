import { RoundType } from '@/backend/models/rounds/RoundType';
import BuzzerRoundService from '@/backend/services/round/BuzzerRoundService';

export default class BasicRoundService extends BuzzerRoundService {
  constructor(gameId) {
    super(gameId, RoundType.BASIC);
  }
}
