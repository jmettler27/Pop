import { Round, type RoundData } from '@/models/rounds/round';
import { RoundType } from '@/models/rounds/round-type';

export interface OddOneOutRoundData extends RoundData {
  mistakePenalty?: number;
  thinkingTime?: number;
}

export class OddOneOutRound extends Round {
  static DEFAULT_MISTAKE_PENALTY = -10;
  static DEFAULT_THINKING_TIME = 30;

  mistakePenalty: number;
  thinkingTime: number;

  constructor(data: OddOneOutRoundData) {
    super(data);
    this.type = RoundType.ODD_ONE_OUT;
    this.mistakePenalty = data.mistakePenalty ?? OddOneOutRound.DEFAULT_MISTAKE_PENALTY;
    this.thinkingTime = data.thinkingTime ?? OddOneOutRound.DEFAULT_THINKING_TIME;
  }

  toObject(): Record<string, unknown> {
    return {
      ...super.toObject(),
      type: this.type,
      mistakePenalty: this.mistakePenalty,
      thinkingTime: this.thinkingTime,
    };
  }

  getMistakePenalty(): number {
    return this.mistakePenalty;
  }

  getThinkingTime(): number {
    return this.thinkingTime;
  }
}
