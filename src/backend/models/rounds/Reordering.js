import { Round } from '@/backend/models/rounds/Round';
import { RoundType } from '@/backend/models/rounds/RoundType';

export class ReorderingRound extends Round {
  static DEFAULT_THINKING_TIME = 30;

  constructor(data) {
    super(data);
    this.type = RoundType.REORDERING;

    this.thinkingTime = data.thinkingTime || ReorderingRound.DEFAULT_THINKING_TIME;
  }

  toObject() {
    return {
      ...super.toObject(),
      type: this.type,
      thinkingTime: this.thinkingTime,
    };
  }

  getThinkingTime() {
    return this.thinkingTime;
  }

  calculateMaxPointsTransaction() {
    // The total number of quote elements to guess in the round
    return this.questions.reduce((acc, { details: { ordering } }) => {
      return acc + ordering.length;
    }, 0);
  }
}
