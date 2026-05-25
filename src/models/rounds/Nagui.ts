import { Round, type RoundData } from '@/models/rounds/round';
import { RoundType } from '@/models/rounds/round-type';

export interface NaguiRoundData extends RoundData {
  rewardsPerQuestion?: Record<string, number>;
  thinkingTime?: number;
}

export class NaguiRound extends Round {
  static DEFAULT_THINKING_TIME = 30;
  static DEFAULT_REWARDS_PER_QUESTION = { hide: 5, square: 3, duo: 2 };

  rewardsPerQuestion: Record<string, number>;
  thinkingTime: number;

  constructor(data: NaguiRoundData) {
    super(data);
    this.type = RoundType.NAGUI;
    this.maxPoints = data.maxPoints ?? null;
    this.rewardsPerQuestion = data.rewardsPerQuestion ?? NaguiRound.DEFAULT_REWARDS_PER_QUESTION;
    this.thinkingTime = data.thinkingTime ?? NaguiRound.DEFAULT_THINKING_TIME;
  }

  toObject(): Record<string, unknown> {
    return {
      ...super.toObject(),
      type: this.type,
      rewardsPerQuestion: this.rewardsPerQuestion,
      maxPoints: this.maxPoints,
      thinkingTime: this.thinkingTime,
    };
  }
}
