import { Round, type RoundData } from '@/models/rounds/round';
import { RoundType } from '@/models/rounds/round-type';

export interface EnumerationRoundData extends RoundData {
  rewardsPerQuestion?: number;
  thinkingTime?: number;
  reflectionTime?: number;
  challengeTime?: number;
  rewardsForBonus?: number;
}

export class EnumerationRound extends Round {
  static REWARDS_PER_QUESTION = 1;
  static REWARDS_FOR_BONUS = 1;
  static DEFAULT_THINKING_TIME = 60;
  static DEFAULT_CHALLENGE_TIME = 120;

  rewardsPerQuestion: number;
  thinkingTime: number;
  challengeTime: number;
  rewardsForBonus: number;

  constructor(data: EnumerationRoundData) {
    super(data);
    this.type = RoundType.ENUMERATION;
    this.maxPoints = data.maxPoints ?? null;
    this.rewardsPerQuestion = data.rewardsPerQuestion ?? EnumerationRound.REWARDS_PER_QUESTION;
    this.thinkingTime = data.thinkingTime ?? data.reflectionTime ?? EnumerationRound.DEFAULT_THINKING_TIME;
    this.challengeTime = data.challengeTime ?? EnumerationRound.DEFAULT_CHALLENGE_TIME;
    this.rewardsForBonus = data.rewardsForBonus ?? EnumerationRound.REWARDS_FOR_BONUS;
  }

  toObject(): Record<string, unknown> {
    return {
      ...super.toObject(),
      type: this.type,
      rewardsPerQuestion: this.rewardsPerQuestion,
      thinkingTime: this.thinkingTime,
      challengeTime: this.challengeTime,
      rewardsForBonus: this.rewardsForBonus,
    };
  }
}
