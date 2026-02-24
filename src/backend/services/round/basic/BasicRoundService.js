import BuzzerRoundService from '@/backend/services/round/BuzzerRoundService';
import { RoundType } from '@/backend/models/rounds/RoundType';

export default class BasicRoundService extends BuzzerRoundService {
  constructor(gameId) {
    super(gameId, RoundType.BASIC);
  }
}
