import { Round } from '@/backend/models/rounds/Round';
import { RoundType } from '@/backend/models/rounds/RoundType';

// Mixed round
export class MixedRound extends Round {
  constructor(data) {
    super(data);
    this.type = RoundType.MIXED;

    this.maxPoints = this.questions.reduce((total, q) => total + q.getMaxPoints(), 0);
  }

  toObject() {
    return {
      ...super.toObject(),
      type: this.type,
      maxPoints: this.maxPoints,
    };
  }

  getMaxPoints() {
    return this.questions.reduce((total, q) => total + q.getMaxPoints(), 0);
  }

  getThinkingTime() {
    return this.delay;
  }
}
