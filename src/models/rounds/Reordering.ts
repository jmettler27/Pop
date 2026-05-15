import { Round, type RoundData } from '@/models/rounds/round';
import { RoundType } from '@/models/rounds/round-type';

export interface ReorderingRoundData extends RoundData {
  thinkingTime?: number;
  rewardsPerElement?: number;
}

export class ReorderingRound extends Round {
  static DEFAULT_THINKING_TIME = 60;
  static REWARDS_PER_ELEMENT = 1;

  thinkingTime: number;
  rewardsPerElement: number;

  constructor(data: ReorderingRoundData) {
    super(data);
    this.type = RoundType.REORDERING;
    this.maxPoints = data.maxPoints ?? null;
    this.thinkingTime = data.thinkingTime ?? ReorderingRound.DEFAULT_THINKING_TIME;
    this.rewardsPerElement = data.rewardsPerElement ?? ReorderingRound.REWARDS_PER_ELEMENT;
  }

  toObject(): Record<string, unknown> {
    return {
      ...super.toObject(),
      type: this.type,
      maxPoints: this.maxPoints,
      thinkingTime: this.thinkingTime,
      rewardsPerElement: this.rewardsPerElement,
    };
  }
}
