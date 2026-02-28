import { RoundType } from '@/backend/models/rounds/RoundType';

import { BasicRound } from '@/backend/models/rounds/Basic';
import { BlindtestRound } from '@/backend/models/rounds/Blindtest';
import { EmojiRound } from '@/backend/models/rounds/Emoji';
import { EnumerationRound } from '@/backend/models/rounds/Enumeration';
import { ImageRound } from '@/backend/models/rounds/Image';
import { LabellingRound } from '@/backend/models/rounds/Labelling';
import { MatchingRound } from '@/backend/models/rounds/Matching';
import { MCQRound } from '@/backend/models/rounds/MCQ';
import { MixedRound } from '@/backend/models/rounds/Mixed';
import { NaguiRound } from '@/backend/models/rounds/Nagui';
import { OddOneOutRound } from '@/backend/models/rounds/OddOneOut';
import { ProgressiveCluesRound } from '@/backend/models/rounds/ProgressiveClues';
import { QuoteRound } from '@/backend/models/rounds/Quote';
import { ReorderingRound } from '@/backend/models/rounds/Reordering';
import { SpecialRound } from '@/backend/models/rounds/Special';

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
