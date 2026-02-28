import { RoundType } from '@/backend/models/rounds/RoundType';

import BasicRoundRepository from '@/backend/repositories/round/BasicRoundRepository';
import BlindtestRoundRepository from '@/backend/repositories/round/BlindtestRoundRepository';
import EmojiRoundRepository from '@/backend/repositories/round/EmojiRoundRepository';
import EnumerationRoundRepository from '@/backend/repositories/round/EnumerationRoundRepository';
import ImageRoundRepository from '@/backend/repositories/round/ImageRoundRepository';
import LabellingRoundRepository from '@/backend/repositories/round/LabellingRoundRepository';
import MatchingRoundRepository from '@/backend/repositories/round/MatchingRoundRepository';
import MCQRoundRepository from '@/backend/repositories/round/MCQRoundRepository';
import NaguiRoundRepository from '@/backend/repositories/round/NaguiRoundRepository';
import OddOneOutRoundRepository from '@/backend/repositories/round/OddOneOutRoundRepository';
import ProgressiveCluesRoundRepository from '@/backend/repositories/round/ProgressiveCluesRoundRepository';
import QuoteRoundRepository from '@/backend/repositories/round/QuoteRoundRepository';
import ReorderingRoundRepository from '@/backend/repositories/round/ReorderingRoundRepository';
import SpecialRoundRepository from '@/backend/repositories/round/SpecialRoundRepository';
import MixedRoundRepository from '@/backend/repositories/round/MixedRoundRepository';

export default class RoundRepositoryFactory {
  static createRepository(roundType, gameId) {
    switch (roundType) {
      case RoundType.BASIC:
        return new BasicRoundRepository(gameId);
      case RoundType.BLINDTEST:
        return new BlindtestRoundRepository(gameId);
      case RoundType.EMOJI:
        return new EmojiRoundRepository(gameId);
      case RoundType.ENUMERATION:
        return new EnumerationRoundRepository(gameId);
      case RoundType.IMAGE:
        return new ImageRoundRepository(gameId);
      case RoundType.LABELLING:
        return new LabellingRoundRepository(gameId);
      case RoundType.MATCHING:
        return new MatchingRoundRepository(gameId);
      case RoundType.MCQ:
        return new MCQRoundRepository(gameId);
      case RoundType.NAGUI:
        return new NaguiRoundRepository(gameId);
      case RoundType.ODD_ONE_OUT:
        return new OddOneOutRoundRepository(gameId);
      case RoundType.PROGRESSIVE_CLUES:
        return new ProgressiveCluesRoundRepository(gameId);
      case RoundType.QUOTE:
        return new QuoteRoundRepository(gameId);
      case RoundType.REORDERING:
        return new ReorderingRoundRepository(gameId);
      case RoundType.SPECIAL:
        return new SpecialRoundRepository(gameId);
      case RoundType.MIXED:
        return new MixedRoundRepository(gameId);
      default:
        throw new Error(`Unknown round type: ${roundType}`);
    }
  }
}
