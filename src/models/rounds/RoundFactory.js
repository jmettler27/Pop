import { BasicRound } from '@/models/rounds/Basic';
import { BlindtestRound } from '@/models/rounds/Blindtest';
import { EmojiRound } from '@/models/rounds/Emoji';
import { EnumerationRound } from '@/models/rounds/Enumeration';
import { EstimationRound } from '@/models/rounds/Estimation';
import { ImageRound } from '@/models/rounds/Image';
import { LabellingRound } from '@/models/rounds/Labelling';
import { MatchingRound } from '@/models/rounds/Matching';
import { MCQRound } from '@/models/rounds/MCQ';
import { MixedRound } from '@/models/rounds/Mixed';
import { NaguiRound } from '@/models/rounds/Nagui';
import { OddOneOutRound } from '@/models/rounds/OddOneOut';
import { ProgressiveCluesRound } from '@/models/rounds/ProgressiveClues';
import { QuoteRound } from '@/models/rounds/Quote';
import { ReorderingRound } from '@/models/rounds/Reordering';
import { RoundType } from '@/models/rounds/RoundType';
import { SpecialRound } from '@/models/rounds/Special';

export default class RoundFactory {
  /**
   * Create a round
   * @param {string} type - The type of the round
   * @param {Object} data - The data of the round
   * @returns {Round}
   */
  static createRound(type, data) {
    switch (type) {
      case RoundType.BASIC:
        return new BasicRound(data);
      case RoundType.BLINDTEST:
        return new BlindtestRound(data);
      case RoundType.EMOJI:
        return new EmojiRound(data);
      case RoundType.ENUMERATION:
        return new EnumerationRound(data);
      case RoundType.ESTIMATION:
        return new EstimationRound(data);
      case RoundType.IMAGE:
        return new ImageRound(data);
      case RoundType.LABELLING:
        return new LabellingRound(data);
      case RoundType.MATCHING:
        return new MatchingRound(data);
      case RoundType.MCQ:
        return new MCQRound(data);
      case RoundType.MIXED:
        return new MixedRound(data);
      case RoundType.NAGUI:
        return new NaguiRound(data);
      case RoundType.ODD_ONE_OUT:
        return new OddOneOutRound(data);
      case RoundType.PROGRESSIVE_CLUES:
        return new ProgressiveCluesRound(data);
      case RoundType.QUOTE:
        return new QuoteRound(data);
      case RoundType.REORDERING:
        return new ReorderingRound(data);
      case RoundType.SPECIAL:
        return new SpecialRound(data);
      default:
        throw new Error(`Unknown round type: ${type}`);
    }
  }
}
