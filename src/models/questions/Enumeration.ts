import { BaseQuestion, GameQuestion, type BaseQuestionData, type GameQuestionData } from '@/models/questions/question';
import { QuestionType } from '@/models/questions/question-type';

export interface EnumerationQuestionData extends BaseQuestionData {
  answer?: string[];
  challengeTime?: number;
  thinkingTime?: number;
  maxIsKnown?: boolean;
  note?: string;
  title?: string;
  details?: {
    answer?: string[];
    challengeTime?: number;
    thinkingTime?: number;
    maxIsKnown?: boolean;
    note?: string;
    title?: string;
  };
}

export class EnumerationQuestion extends BaseQuestion {
  static TITLE_MAX_LENGTH = 75;
  static NOTE_MAX_LENGTH = 500;
  static ANSWER_ITEM_MAX_LENGTH = 50;
  static MIN_NUM_ANSWERS = 2;
  static MAX_NUM_ANSWERS = 100;

  answer: string[] | undefined;
  challengeTime: number | undefined;
  thinkingTime: number | undefined;
  maxIsKnown: boolean | undefined;
  note: string | undefined;
  title: string | undefined;

  constructor(data: EnumerationQuestionData) {
    super(data);
    const d = (data.details ?? {}) as EnumerationQuestionData;
    this.answer = data.answer ?? d.answer;
    this.challengeTime = data.challengeTime ?? d.challengeTime;
    this.thinkingTime = data.thinkingTime ?? d.thinkingTime;
    this.maxIsKnown = data.maxIsKnown ?? d.maxIsKnown;
    this.note = data.note ?? d.note;
    this.title = data.title ?? d.title;
  }

  getQuestionType(): QuestionType {
    return QuestionType.ENUMERATION;
  }

  toObject(): Record<string, unknown> {
    return {
      ...super.toObject(),
      details: {
        answer: this.answer,
        challengeTime: this.challengeTime,
        thinkingTime: this.thinkingTime,
        maxIsKnown: this.maxIsKnown,
        note: this.note,
        title: this.title,
      },
    };
  }

  static validate(data: unknown): boolean {
    return BaseQuestion.validate(data);
  }

  setImage(_imageUrl: string): void {}
  setAudio(_audioUrl: string): void {}
}

export const EnumerationQuestionStatus = {
  THINKING: 'reflection_active',
  CHALLENGE: 'challenge_active',
} as const;
export type EnumerationQuestionStatus = (typeof EnumerationQuestionStatus)[keyof typeof EnumerationQuestionStatus];

export interface GameEnumerationQuestionData extends GameQuestionData {
  status?: string;
  reward?: number;
  rewardsForBonus?: number;
  thinkingTime?: number;
  challengeTime?: number;
}

export class GameEnumerationQuestion extends GameQuestion {
  static REWARD = 1;
  static DEFAULT_BONUS = 1;
  static DEFAULT_THINKING_TIME = 120;
  static DEFAULT_CHALLENGE_TIME = 120;

  status: string;
  reward: number;
  rewardsForBonus: number;
  thinkingTime: number;
  challengeTime: number;

  constructor(data: GameEnumerationQuestionData) {
    super(data);
    this.status = data.status ?? EnumerationQuestionStatus.THINKING;
    this.reward = data.reward ?? GameEnumerationQuestion.REWARD;
    this.rewardsForBonus = data.rewardsForBonus ?? GameEnumerationQuestion.DEFAULT_BONUS;
    this.thinkingTime = data.thinkingTime ?? GameEnumerationQuestion.DEFAULT_THINKING_TIME;
    this.challengeTime = data.challengeTime ?? GameEnumerationQuestion.DEFAULT_CHALLENGE_TIME;
  }

  getQuestionType(): QuestionType {
    return QuestionType.ENUMERATION;
  }

  toObject(): Record<string, unknown> {
    return {
      ...super.toObject(),
      status: this.status,
      reward: this.reward,
      rewardsForBonus: this.rewardsForBonus,
      thinkingTime: this.thinkingTime,
      challengeTime: this.challengeTime,
    };
  }

  static validate(data: unknown): boolean {
    return GameQuestion.validate(data);
  }

  reset(): void {
    this.status = EnumerationQuestionStatus.THINKING;
  }

  static findHighestBidder(bets: Array<{ playerId: string; teamId: string; bet: number }>): [string, string, number] {
    if (!bets || bets.length === 0) throw new Error('Invalid input: bets must be a non-empty array');
    const playerWithMaxBet = bets.reduce((max, current) => (current.bet > max.bet ? current : max), bets[0]);
    return [playerWithMaxBet.playerId, playerWithMaxBet.teamId, playerWithMaxBet.bet];
  }
}

export interface EnumerationQuestionPlayers {
  bets: EnumerationBet[];
  challenger?: EnumerationChallenger;
}

export interface SubmitEnumerationBet {
  bet: number;
  playerId: string;
  teamId: string;
}

export interface EnumerationBet {
  bet: number;
  playerId: string;
  teamId: string;
  timestamp: unknown;
}

export interface EnumerationChallenger {
  bet: number;
  cited: Record<string, unknown>[];
  numCorrect: number;
  playerId: string;
  teamId: string;
}
