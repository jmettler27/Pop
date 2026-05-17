import { BuzzerRound, type BuzzerRoundData } from '@/models/rounds/buzzer';
import { RoundType } from '@/models/rounds/round-type';

export class BlindtestRound extends BuzzerRound {
  constructor(data: BuzzerRoundData) {
    super(data);
    this.type = RoundType.BLINDTEST;
  }

  toObject(): Record<string, unknown> {
    return { ...super.toObject(), type: this.type };
  }
}
