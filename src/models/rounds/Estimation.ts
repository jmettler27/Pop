import { Round, type RoundData } from '@/models/rounds/round';
import { RoundType } from '@/models/rounds/round-type';

export interface EstimationRoundData extends RoundData {
  rewardsPerQuestion?: number;
  thinkingTime?: number;
}

export class EstimationRound extends Round {
  static DEFAULT_THINKING_TIME = 90;
  static REWARDS_PER_QUESTION = 1;

  rewardsPerQuestion: number;
  thinkingTime: number;

  constructor(data: EstimationRoundData) {
    super(data);
    this.type = RoundType.ESTIMATION;
    this.maxPoints = data.maxPoints ?? null;
    this.rewardsPerQuestion = data.rewardsPerQuestion ?? EstimationRound.REWARDS_PER_QUESTION;
    this.thinkingTime = data.thinkingTime ?? EstimationRound.DEFAULT_THINKING_TIME;
  }

  toObject(): Record<string, unknown> {
    return {
      ...super.toObject(),
      type: this.type,
      maxPoints: this.maxPoints,
      thinkingTime: this.thinkingTime,
      rewardsPerQuestion: this.rewardsPerQuestion,
    };
  }

  getMaxPoints(): number | null {
    return this.maxPoints;
  }

  getThinkingTime(): number {
    return this.thinkingTime;
  }

  calculateMaxPointsTransaction(): void {
    this.maxPoints = this.questions.length * this.rewardsPerQuestion;
  }
}
