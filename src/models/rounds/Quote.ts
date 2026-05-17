import { Round, type RoundData } from '@/models/rounds/round';
import { RoundType } from '@/models/rounds/round-type';

export interface QuoteRoundData extends RoundData {
  maxTries?: number;
  invalidateTeam?: boolean;
  thinkingTime?: number;
  rewardsPerElement?: number;
}

export class QuoteRound extends Round {
  static MAX_TRIES = 2;
  static DEFAULT_INVALIDATE_TEAM = false;
  static DEFAULT_THINKING_TIME = 15;
  static REWARDS_PER_ELEMENT = 1;

  maxTries: number;
  invalidateTeam: boolean;
  thinkingTime: number;
  rewardsPerElement: number;

  constructor(data: QuoteRoundData) {
    super(data);
    this.type = RoundType.QUOTE;
    this.maxPoints = data.maxPoints ?? null;
    this.maxTries = data.maxTries ?? QuoteRound.MAX_TRIES;
    this.invalidateTeam = data.invalidateTeam ?? QuoteRound.DEFAULT_INVALIDATE_TEAM;
    this.thinkingTime = data.thinkingTime ?? QuoteRound.DEFAULT_THINKING_TIME;
    this.rewardsPerElement = data.rewardsPerElement ?? QuoteRound.REWARDS_PER_ELEMENT;
  }

  toObject(): Record<string, unknown> {
    return {
      ...super.toObject(),
      type: this.type,
      maxTries: this.maxTries,
      maxPoints: this.maxPoints,
      invalidateTeam: this.invalidateTeam,
      thinkingTime: this.thinkingTime,
      rewardsPerElement: this.rewardsPerElement,
    };
  }

  getMaxPoints(): number | null {
    return this.maxPoints;
  }

  calculateMaxPointsTransaction(): void {
    type QuoteQuestion = { details: { toGuess: string[]; quoteParts: string[] } };
    const totalNumElements = (this.questions as unknown as QuoteQuestion[]).reduce(
      (acc, { details: { toGuess, quoteParts } }) =>
        acc + toGuess.length + (toGuess.includes('quote') ? quoteParts.length - 1 : 0),
      0
    );
    this.maxPoints = totalNumElements * this.rewardsPerElement;
  }
}
