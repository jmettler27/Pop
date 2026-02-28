import { Round } from '@/backend/models/rounds/Round';
import { RoundType } from '@/backend/models/rounds/RoundType';

export class NaguiRound extends Round {
  constructor(data) {
    super(data);
    this.type = RoundType.NAGUI;

    this.maxPoints = data.maxPoints || null;
    this.rewardsPerQuestion = data.rewardsPerQuestion || { hide: 5, square: 3, duo: 2 };
  }

  toObject() {
    return {
      ...super.toObject(),
      type: this.type,
      rewardsPerQuestion: this.rewardsPerQuestion,
      maxPoints: this.maxPoints,
    };
  }
}
