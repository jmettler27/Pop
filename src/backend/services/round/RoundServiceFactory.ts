import BasicRoundService from '@/backend/services/round/BasicRoundService';
import BlindtestRoundService from '@/backend/services/round/BlindtestRoundService';
import EmojiRoundService from '@/backend/services/round/EmojiRoundService';
import EnumerationRoundService from '@/backend/services/round/EnumerationRoundService';
import EstimationRoundService from '@/backend/services/round/EstimationRoundService';
import ImageRoundService from '@/backend/services/round/ImageRoundService';
import LabellingRoundService from '@/backend/services/round/LabellingRoundService';
import MatchingRoundService from '@/backend/services/round/MatchingRoundService';
import MCQRoundService from '@/backend/services/round/MCQRoundService';
import NaguiRoundService from '@/backend/services/round/NaguiRoundService';
import OddOneOutRoundService from '@/backend/services/round/OddOneOutRoundService';
import ProgressiveCluesRoundService from '@/backend/services/round/ProgressiveCluesRoundService';
import QuoteRoundService from '@/backend/services/round/QuoteRoundService';
import ReorderingRoundService from '@/backend/services/round/ReorderingRoundService';
import { RoundType } from '@/models/rounds/round-type';

export default class RoundServiceFactory {
  static createService(roundType: RoundType, gameId: string) {
    switch (roundType) {
      case RoundType.BASIC:
        return new BasicRoundService(gameId);
      case RoundType.BLINDTEST:
        return new BlindtestRoundService(gameId);
      case RoundType.EMOJI:
        return new EmojiRoundService(gameId);
      case RoundType.ENUMERATION:
        return new EnumerationRoundService(gameId);
      case RoundType.ESTIMATION:
        return new EstimationRoundService(gameId);
      case RoundType.IMAGE:
        return new ImageRoundService(gameId);
      case RoundType.LABELLING:
        return new LabellingRoundService(gameId);
      case RoundType.MATCHING:
        return new MatchingRoundService(gameId);
      case RoundType.MCQ:
        return new MCQRoundService(gameId);
      case RoundType.NAGUI:
        return new NaguiRoundService(gameId);
      case RoundType.ODD_ONE_OUT:
        return new OddOneOutRoundService(gameId);
      case RoundType.PROGRESSIVE_CLUES:
        return new ProgressiveCluesRoundService(gameId);
      case RoundType.QUOTE:
        return new QuoteRoundService(gameId);
      case RoundType.REORDERING:
        return new ReorderingRoundService(gameId);
      default:
        throw new Error(`Unknown question type: ${roundType}`);
    }
  }
}
