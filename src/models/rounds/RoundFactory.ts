import { BasicRound } from '@/models/rounds/basic';
import { BlindtestRound } from '@/models/rounds/blindtest';
import { EmojiRound } from '@/models/rounds/emoji';
import { EnumerationRound } from '@/models/rounds/enumeration';
import { EstimationRound } from '@/models/rounds/estimation';
import { ImageRound } from '@/models/rounds/image';
import { LabellingRound } from '@/models/rounds/labelling';
import { MatchingRound } from '@/models/rounds/matching';
import { MCQRound } from '@/models/rounds/mcq';
import { MixedRound } from '@/models/rounds/mixed';
import { NaguiRound } from '@/models/rounds/nagui';
import { OddOneOutRound } from '@/models/rounds/odd-one-out';
import { ProgressiveCluesRound } from '@/models/rounds/progressive-clues';
import { QuoteRound } from '@/models/rounds/quote';
import { ReorderingRound } from '@/models/rounds/reordering';
import { type RoundData } from '@/models/rounds/round';
import { RoundType } from '@/models/rounds/round-type';

export type AnyRound =
  | BasicRound
  | BlindtestRound
  | EmojiRound
  | EnumerationRound
  | EstimationRound
  | ImageRound
  | LabellingRound
  | MatchingRound
  | MCQRound
  | MixedRound
  | NaguiRound
  | OddOneOutRound
  | ProgressiveCluesRound
  | QuoteRound
  | ReorderingRound;

export default class RoundFactory {
  static createRound(type: RoundType, data: RoundData): AnyRound {
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
      default:
        throw new Error(`Unknown round type: ${String(type)}`);
    }
  }
}
