import { BuzzerRound } from '@/models/rounds/Buzzer';
import { RoundType } from '@/models/rounds/RoundType';

export class ImageRound extends BuzzerRound {
  constructor(data) {
    super(data);
    this.type = RoundType.IMAGE;
  }

  toObject() {
    return {
      ...super.toObject(),
      type: this.type,
    };
  }
}
