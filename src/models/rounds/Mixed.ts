import { Round, type RoundData } from '@/models/rounds/round';
import { RoundType } from '@/models/rounds/round-type';

type HydratedQuestion = { getMaxPoints(): number };

export class MixedRound extends Round {
  constructor(data: RoundData) {
    super(data);
    this.type = RoundType.MIXED;
    this.maxPoints = (this.questions as unknown as HydratedQuestion[]).reduce(
      (total, q) => total + q.getMaxPoints(),
      0
    );
  }

  toObject(): Record<string, unknown> {
    return { ...super.toObject(), type: this.type, maxPoints: this.maxPoints };
  }

  getMaxPoints(): number {
    return (this.questions as unknown as HydratedQuestion[]).reduce((total, q) => total + q.getMaxPoints(), 0);
  }
}
