import { Round } from '@/backend/models/rounds/Round';
import { RoundType } from '@/backend/models/rounds/RoundType';

export class MCQRound extends Round {
  static REWARDS_PER_QUESTION = 1;
  static DEFAULT_THINKING_TIME = 15;

  constructor(data) {
    super(data);
    this.type = RoundType.MCQ;

    this.rewardsPerQuestion = data.rewardsPerQuestion || MCQRound.REWARDS_PER_QUESTION;
    this.thinkingTime = data.thinkingTime || MCQRound.DEFAULT_THINKING_TIME;
  }

  toObject() {
    return {
      ...super.toObject(),
      type: this.type,
      rewardsPerQuestion: this.rewardsPerQuestion,
      thinkingTime: this.thinkingTime,
    };
  }

  calculateMaxPointsTransaction() {
    return this.getNumQuestions() * (this.rewardsPerQuestion + this.rewardsForBonus);
  }
}
