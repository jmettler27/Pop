import { Round, type RoundData } from '@/models/rounds/round';
import { RoundType } from '@/models/rounds/round-type';

export interface MCQRoundData extends RoundData {
  rewardsPerQuestion?: number;
  rewardsForBonus?: number;
  thinkingTime?: number;
}

export class MCQRound extends Round {
  static REWARDS_PER_QUESTION = 1;
  static DEFAULT_THINKING_TIME = 30;

  rewardsPerQuestion: number;
  rewardsForBonus: number;
  thinkingTime: number;

  constructor(data: MCQRoundData) {
    super(data);
    this.type = RoundType.MCQ;
    this.maxPoints = data.maxPoints ?? null;
    this.rewardsPerQuestion = data.rewardsPerQuestion ?? MCQRound.REWARDS_PER_QUESTION;
    this.rewardsForBonus = data.rewardsForBonus ?? 0;
    this.thinkingTime = data.thinkingTime ?? MCQRound.DEFAULT_THINKING_TIME;
  }

  toObject(): Record<string, unknown> {
    return {
      ...super.toObject(),
      type: this.type,
      rewardsPerQuestion: this.rewardsPerQuestion,
      thinkingTime: this.thinkingTime,
    };
  }

  calculateMaxPointsTransaction(): void {
    this.maxPoints = this.getNumQuestions() * (this.rewardsPerQuestion + this.rewardsForBonus);
  }
}
