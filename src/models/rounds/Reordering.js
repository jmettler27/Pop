import { Round } from '@/models/rounds/Round';
import { RoundType } from '@/models/rounds/RoundType';

export class ReorderingRound extends Round {
  static DEFAULT_THINKING_TIME = 60;
  static REWARDS_PER_ELEMENT = 1;

  constructor(data) {
    super(data);
    this.type = RoundType.REORDERING;

    this.maxPoints = data.maxPoints || null;
    this.thinkingTime = data.thinkingTime || ReorderingRound.DEFAULT_THINKING_TIME;
    this.rewardsPerElement = data.rewardsPerElement || ReorderingRound.REWARDS_PER_ELEMENT;
  }

  toObject() {
    return {
      ...super.toObject(),
      type: this.type,
      maxPoints: this.maxPoints,
      thinkingTime: this.thinkingTime,
      rewardsPerElement: this.rewardsPerElement,
    };
  }

  getMaxPoints() {
    return this.maxPoints;
  }

  getThinkingTime() {
    return this.thinkingTime;
  }

  calculateMaxPointsTransaction() {
    return this.questions.reduce((acc, { details: { ordering } }) => {
      return acc + ordering.length * this.rewardsPerElement;
    }, 0);
  }
}
