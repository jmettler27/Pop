import { RoundType } from '@/backend/models/rounds/RoundType';
import BasicRoundService from '@/backend/services/round/basic/BasicRoundService';
import BlindtestRoundService from '@/backend/services/round/blindtest/BlindtestRoundService';
import EmojiRoundService from '@/backend/services/round/emoji/EmojiRoundService';
import EnumerationRoundService from '@/backend/services/round/enumeration/EnumerationRoundService';
import ImageRoundService from '@/backend/services/round/image/ImageRoundService';
import LabellingRoundService from '@/backend/services/round/labelling/LabellingRoundService';
import MatchingRoundService from '@/backend/services/round/matching/MatchingRoundService';
import MCQRoundService from '@/backend/services/round/mcq/MCQRoundService';
import NaguiRoundService from '@/backend/services/round/nagui/NaguiRoundService';
import OddOneOutRoundService from '@/backend/services/round/odd-one-out/OddOneOutRoundService';
import ProgressiveCluesRoundService from '@/backend/services/round/progressive-clues/ProgressiveCluesRoundService';
import QuoteRoundService from '@/backend/services/round/quote/QuoteRoundService';
import ReorderingRoundService from '@/backend/services/round/reordering/ReorderingRoundService';

export default class RoundServiceFactory {
  static createService(roundType, gameId) {
    console.log('createService', roundType, gameId);
    switch (roundType) {
      case RoundType.BASIC:
        return new BasicRoundService(gameId);
      case RoundType.BLINDTEST:
        return new BlindtestRoundService(gameId);
      case RoundType.EMOJI:
        return new EmojiRoundService(gameId);
      case RoundType.ENUMERATION:
        return new EnumerationRoundService(gameId);
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
