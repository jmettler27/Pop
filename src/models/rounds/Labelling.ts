import { Round, type RoundData } from '@/models/rounds/round';
import { RoundType } from '@/models/rounds/round-type';

export interface LabellingRoundData extends RoundData {
  maxTries?: number;
  invalidateTeam?: boolean;
  thinkingTime?: number;
  rewardsPerElement?: number;
}

export class LabellingRound extends Round {
  static MAX_TRIES = 1;
  static DEFAULT_INVALIDATE_TEAM = false;
  static DEFAULT_THINKING_TIME = 30;
  static REWARDS_PER_ELEMENT = 1;

  maxTries: number;
  invalidateTeam: boolean;
  thinkingTime: number;
  rewardsPerElement: number;

  constructor(data: LabellingRoundData) {
    super(data);
    this.type = RoundType.LABELLING;
    this.maxPoints = data.maxPoints ?? null;
    this.maxTries = data.maxTries ?? LabellingRound.MAX_TRIES;
    this.invalidateTeam = data.invalidateTeam ?? LabellingRound.DEFAULT_INVALIDATE_TEAM;
    this.thinkingTime = data.thinkingTime ?? LabellingRound.DEFAULT_THINKING_TIME;
    this.rewardsPerElement = data.rewardsPerElement ?? LabellingRound.REWARDS_PER_ELEMENT;
  }

  toObject(): Record<string, unknown> {
    return {
      ...super.toObject(),
      type: this.type,
      maxTries: this.maxTries,
      invalidateTeam: this.invalidateTeam,
      thinkingTime: this.thinkingTime,
      rewardsPerElement: this.rewardsPerElement,
    };
  }

  calculateMaxPointsTransaction(): void {
    type LabelQuestion = { details: { labels: unknown[] } };
    this.maxPoints =
      (this.questions as unknown as LabelQuestion[]).reduce((acc, { details: { labels } }) => acc + labels.length, 0) *
      this.rewardsPerElement;
  }
}
