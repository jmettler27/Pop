import BuzzerRoundService from '@/backend/services/round/BuzzerRoundService';
import { RoundType } from '@/models/rounds/RoundType';

export default class EmojiRoundService extends BuzzerRoundService {
  constructor(gameId) {
    super(gameId, RoundType.EMOJI);
  }
}
