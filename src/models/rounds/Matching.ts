import { Round, type RoundData } from '@/models/rounds/round';
import { RoundType } from '@/models/rounds/round-type';

export interface MatchingRoundData extends RoundData {
  mistakePenalty?: number;
  maxMistakes?: number;
  thinkingTime?: number;
}

export class MatchingRound extends Round {
  static DEFAULT_MAX_MISTAKES = 3;
  static DEFAULT_MISTAKE_PENALTY = -5;
  static DEFAULT_THINKING_TIME = 60;

  mistakePenalty: number;
  maxMistakes: number;
  thinkingTime: number;

  constructor(data: MatchingRoundData) {
    super(data);
    this.type = RoundType.MATCHING;
    this.mistakePenalty = data.mistakePenalty ?? MatchingRound.DEFAULT_MISTAKE_PENALTY;
    this.maxMistakes = data.maxMistakes ?? MatchingRound.DEFAULT_MAX_MISTAKES;
    this.thinkingTime = data.thinkingTime ?? MatchingRound.DEFAULT_THINKING_TIME;
  }

  toObject(): Record<string, unknown> {
    return {
      ...super.toObject(),
      type: this.type,
      mistakePenalty: this.mistakePenalty,
      maxMistakes: this.maxMistakes,
      thinkingTime: this.thinkingTime,
    };
  }

  getMistakePenalty(): number {
    return this.mistakePenalty;
  }

  getMaxMistakes(): number {
    return this.maxMistakes;
  }
}
