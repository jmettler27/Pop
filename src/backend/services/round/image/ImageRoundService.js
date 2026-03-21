import { RoundType } from '@/backend/models/rounds/RoundType';
import BuzzerRoundService from '@/backend/services/round/BuzzerRoundService';

export default class ImageRoundService extends BuzzerRoundService {
  constructor(gameId) {
    super(gameId, RoundType.IMAGE);
  }
}
