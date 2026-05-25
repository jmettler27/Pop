import { Round, type RoundData } from '@/models/rounds/round';
import { RoundType } from '@/models/rounds/round-type';

export class MixedRound extends Round {
  constructor(data: RoundData) {
    super(data);
    this.type = RoundType.MIXED;
  }

  toObject(): Record<string, unknown> {
    return { ...super.toObject(), type: this.type, maxPoints: this.maxPoints };
  }
}
