import { Round } from '@/models/rounds/Round';
import { RoundType } from '@/models/rounds/RoundType';

export class EstimationRound extends Round {
  static DEFAULT_THINKING_TIME = 90;
  static REWARDS_PER_QUESTION = 1;

  constructor(data) {
    super(data);
    this.type = RoundType.ESTIMATION;

    this.maxPoints = data.maxPoints || null;
    this.rewardsPerQuestion = data.rewardsPerQuestion || EstimationRound.REWARDS_PER_QUESTION;
    this.thinkingTime = data.thinkingTime || EstimationRound.DEFAULT_THINKING_TIME;
  }

  toObject() {
    return {
      ...super.toObject(),
      type: this.type,
      maxPoints: this.maxPoints,
      thinkingTime: this.thinkingTime,
      rewardsPerQuestion: this.rewardsPerQuestion,
    };
  }

  getMaxPoints() {
    return this.maxPoints;
  }

  getThinkingTime() {
    return this.thinkingTime;
  }

  calculateMaxPointsTransaction() {
    return this.questions.length * this.rewardsPerQuestion;
  }
}
