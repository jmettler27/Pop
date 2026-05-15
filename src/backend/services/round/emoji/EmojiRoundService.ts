import BuzzerRoundService from '@/backend/services/round/BuzzerRoundService';
import { RoundType } from '@/models/rounds/round-type';

export default class EmojiRoundService extends BuzzerRoundService {
  constructor(gameId: string) {
    super(gameId, RoundType.EMOJI);
  }
}
