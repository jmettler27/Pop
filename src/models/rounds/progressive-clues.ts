import { BuzzerRound, type BuzzerRoundData } from '@/models/rounds/buzzer';
import { RoundType } from '@/models/rounds/round-type';

export interface ProgressiveCluesRoundData extends BuzzerRoundData {
  delay?: number;
}

export class ProgressiveCluesRound extends BuzzerRound {
  static DEFAULT_DELAY = 2;

  delay: number;

  constructor(data: ProgressiveCluesRoundData) {
    super(data);
    this.type = RoundType.PROGRESSIVE_CLUES;
    this.delay = data.delay ?? ProgressiveCluesRound.DEFAULT_DELAY;
  }

  toObject(): Record<string, unknown> {
    return { ...super.toObject(), type: this.type, delay: this.delay };
  }

  getDelay(): number {
    return this.delay;
  }
}
