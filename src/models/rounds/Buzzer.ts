import { Round, type RoundData } from '@/models/rounds/round';

export interface BuzzerRoundData extends RoundData {
  rewardsPerQuestion?: number;
  maxTries?: number;
  invalidateTeam?: boolean;
  thinkingTime?: number;
}

export class BuzzerRound extends Round {
  static MAX_TRIES = 2;
  static DEFAULT_INVALIDATE_TEAM = false;
  static DEFAULT_THINKING_TIME = 15;
  static REWARDS_PER_QUESTION = 1;

  rewardsPerQuestion: number;
  maxTries: number;
  invalidateTeam: boolean;
  thinkingTime: number;

  constructor(data: BuzzerRoundData) {
    super(data);
    this.rewardsPerQuestion = data.rewardsPerQuestion ?? BuzzerRound.REWARDS_PER_QUESTION;
    this.maxTries = data.maxTries ?? BuzzerRound.MAX_TRIES;
    this.maxPoints = data.maxPoints ?? null;
    this.invalidateTeam = data.invalidateTeam ?? BuzzerRound.DEFAULT_INVALIDATE_TEAM;
    this.thinkingTime = data.thinkingTime ?? BuzzerRound.DEFAULT_THINKING_TIME;
  }

  toObject(): Record<string, unknown> {
    return {
      ...super.toObject(),
      rewardsPerQuestion: this.rewardsPerQuestion,
      maxTries: this.maxTries,
      maxPoints: this.maxPoints,
      invalidateTeam: this.invalidateTeam,
      thinkingTime: this.thinkingTime,
    };
  }

  calculateMaxPointsTransaction(): void {
    this.maxPoints = this.getNumQuestions() * this.rewardsPerQuestion;
  }

  getMaxPoints(): number | null {
    return this.maxPoints;
  }

  getMaxTries(): number {
    return this.maxTries;
  }

  getInvalidateTeam(): boolean {
    return this.invalidateTeam;
  }

  getRewardsPerQuestion(): number {
    return this.rewardsPerQuestion;
  }

  getThinkingTime(): number {
    return this.thinkingTime;
  }
}
