import { BuzzerRound } from '@/models/rounds/Buzzer';
import { RoundType } from '@/models/rounds/RoundType';

export class BlindtestRound extends BuzzerRound {
  constructor(data) {
    super(data);
    this.type = RoundType.BLINDTEST;
  }

  toObject() {
    return {
      ...super.toObject(),
      type: this.type,
    };
  }
}
