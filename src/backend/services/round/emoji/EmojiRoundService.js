import BuzzerRoundService from '@/backend/services/round/BuzzerRoundService';
import { RoundType } from '@/backend/models/rounds/RoundType';

export default class EmojiRoundService extends BuzzerRoundService {
  constructor(gameId) {
    super(gameId, RoundType.EMOJI);
  }
}
