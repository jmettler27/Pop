import { BuzzerRound } from '@/models/rounds/Buzzer';
import { RoundType } from '@/models/rounds/RoundType';

export class BasicRound extends BuzzerRound {
  constructor(data) {
    super(data);
    this.type = RoundType.BASIC;
  }

  toObject() {
    return {
      ...super.toObject(),
      type: this.type,
    };
  }
}
