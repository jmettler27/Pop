import { type RoundType } from '@/models/rounds/round-type';
import { ScorePolicyType } from '@/models/score-policy';

import { RankingDifferences } from '../scores';

export const RoundStatus = {
  START: 'round_start',
  END: 'round_end',
  QUESTION_ACTIVE: 'question_active',
  QUESTION_END: 'question_end',
} as const;

export type RoundStatus = (typeof RoundStatus)[keyof typeof RoundStatus];

export interface CreateRoundData {
  title: string;
  scorePolicy: ScorePolicyType;
  currentQuestionIdx?: number;
}

export interface RoundData {
  id?: string;
  title?: string;
  type?: RoundType;
  createdAt?: unknown;
  dateStart?: unknown;
  dateEnd?: unknown;
  order?: number | null;
  questions?: string[];
  currentQuestionIdx?: number;
  scorePolicy?: ScorePolicyType;
  rewards?: number[];
  maxPoints?: number | null;
  [key: string]: unknown;
}

export class Round {
  static TITLE_MAX_LENGTH = 50;
  static REWARDS = [3, 2, 1];
  static REWARDS_PER_QUESTION = 1;
  static MIN_NUM_QUESTIONS = 5;
  static MAX_NUM_QUESTIONS = 100;

  id: string | undefined;
  title: string | undefined;
  type: RoundType | undefined;
  createdAt: unknown;
  dateStart: unknown;
  dateEnd: unknown;
  order: number | null;
  questions: string[];
  currentQuestionIdx: number | undefined;
  scorePolicy: ScorePolicyType | undefined;
  rewards: number[] | undefined;
  maxPoints: number | null;

  constructor(data: RoundData) {
    if (!data) throw new Error('Round data is required');
    this.id = data.id;
    this.title = data.title;
    this.type = data.type;
    this.createdAt = data.createdAt ?? new Date();
    this.dateStart = data.dateStart ?? null;
    this.dateEnd = data.dateEnd ?? null;
    this.order = data.order ?? null;
    this.questions = data.questions ?? [];
    this.currentQuestionIdx = data.currentQuestionIdx;
    this.scorePolicy = data.scorePolicy;
    this.rewards = data.rewards;
    this.maxPoints = data.maxPoints ?? null;
  }

  toObject(): Record<string, unknown> {
    const obj: Record<string, unknown> = {
      title: this.title,
      type: this.type,
      createdAt: this.createdAt,
      dateStart: this.dateStart,
      dateEnd: this.dateEnd,
      order: this.order,
      questions: this.questions,
      currentQuestionIdx: this.currentQuestionIdx,
      scorePolicy: this.scorePolicy,
    };
    if (this.scorePolicy === ScorePolicyType.RANKING) {
      obj['rewards'] = this.rewards;
    } else if (this.scorePolicy === ScorePolicyType.COMPLETION_RATE) {
      obj['maxPoints'] = this.maxPoints;
    }
    return obj;
  }

  updateId(id: string): void {
    if (!id) throw new Error('Round id is required');
    this.id = id;
  }

  calculateMaxPointsTransaction(): void {
    throw new Error('calculateMaxPoints not implemented');
  }

  getMaxPoints(): number | null {
    return this.maxPoints;
  }

  getQuestionIds(): string[] {
    return this.questions;
  }

  getNumQuestions(): number {
    return this.questions.length;
  }

  isLastQuestion(): boolean {
    return this.currentQuestionIdx === this.questions.length - 1;
  }

  static calculateRankDifferences(
    prevRankings: Array<{ teams: string[] }>,
    newRankings: Array<{ teams: string[] }>
  ): RankingDifferences {
    const rankDiff: RankingDifferences = {};
    for (let i = 0; i < prevRankings.length; i++) {
      for (const teamId of prevRankings[i].teams) {
        const newIndex = newRankings.findIndex((item) => item.teams.includes(teamId));
        rankDiff[teamId] = i - newIndex;
      }
    }
    return rankDiff;
  }
}
