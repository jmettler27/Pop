import { BaseQuestion, GameQuestion, type BaseQuestionData, type GameQuestionData } from '@/models/questions/question';
import { QuestionType } from '@/models/questions/question-type';

export interface EstimationQuestionData extends BaseQuestionData {
  answerType?: string;
  answer?: string;
  explanation?: string;
  note?: string;
  source?: string;
  title?: string;
  details?: {
    answerType?: string;
    answer?: string;
    explanation?: string;
    note?: string;
    source?: string;
    title?: string;
  };
}

export class EstimationQuestion extends BaseQuestion {
  static AnswerType = Object.freeze({
    INTEGER: 'integer',
    DECIMAL: 'decimal',
    YEAR: 'year',
    DATE: 'date',
  });

  static BetType = Object.freeze({ EXACT: 'exact', RANGE: 'range' });

  static INTEGER_MIN = -999_999_999;
  static INTEGER_MAX = 999_999_999;
  static DECIMAL_MIN = -999_999_999.999_999;
  static DECIMAL_MAX = 999_999_999.999_999;
  static YEAR_MIN = 1;
  static YEAR_MAX = 9999;
  static DATE_MIN = '0001-01-01';
  static DATE_MAX = '9999-12-31';
  static EXPLANATION_MAX_LENGTH = 200;
  static NOTE_MAX_LENGTH = 500;
  static SOURCE_MAX_LENGTH = 75;
  static TITLE_MAX_LENGTH = 75;

  answerType: string;
  answer: string;
  explanation: string;
  note: string;
  source: string;
  title: string;

  constructor(data: EstimationQuestionData) {
    super(data);
    const d = data.details ?? {};
    this.answerType = data.answerType ?? d.answerType ?? EstimationQuestion.AnswerType.INTEGER;
    this.answer = data.answer ?? d.answer ?? '';
    this.explanation = data.explanation ?? d.explanation ?? '';
    this.note = data.note ?? d.note ?? '';
    this.source = data.source ?? d.source ?? '';
    this.title = data.title ?? d.title ?? '';
  }

  getQuestionType(): QuestionType {
    return QuestionType.ESTIMATION;
  }

  toObject(): Record<string, unknown> {
    return {
      ...super.toObject(),
      details: {
        answerType: this.answerType,
        answer: this.answer,
        explanation: this.explanation,
        note: this.note,
        source: this.source,
        title: this.title,
      },
    };
  }

  static validate(data: unknown): boolean {
    return BaseQuestion.validate(data);
  }

  setImage(_imageUrl: string): void {}
  setAudio(_audioUrl: string): void {}

  static parseAnswer(answerType: string, answerStr: string): number | string | null {
    if (!answerStr) return null;
    switch (answerType) {
      case EstimationQuestion.AnswerType.INTEGER:
      case EstimationQuestion.AnswerType.YEAR: {
        const n = parseInt(answerStr, 10);
        return isNaN(n) ? null : n;
      }
      case EstimationQuestion.AnswerType.DECIMAL: {
        const n = parseFloat(answerStr);
        return isNaN(n) ? null : n;
      }
      case EstimationQuestion.AnswerType.DATE:
        return answerStr;
      default:
        return null;
    }
  }
}

export interface EstimationBet {
  playerId: string;
  teamId: string;
  type: string;
  estimation: string;
  // lower?: string;
  // upper?: string;
  submittedAt: unknown;
}

export interface ExactEstimationBet extends EstimationBet {
  type: typeof EstimationQuestion.BetType.EXACT;
  estimation: string;
}

export function isExactEstimationBet(bet: EstimationBet): bet is ExactEstimationBet {
  return bet.type === EstimationQuestion.BetType.EXACT;
}

export interface RangeEstimationBet extends EstimationBet {
  type: typeof EstimationQuestion.BetType.RANGE;
  lower: string;
  upper: string;
}

export function isRangeEstimationBet(bet: EstimationBet): bet is RangeEstimationBet {
  return bet.type === EstimationQuestion.BetType.RANGE && 'lower' in bet && 'upper' in bet;
}

export interface GameEstimationQuestionData extends GameQuestionData {
  bets?: EstimationBet[];
  reward?: number;
  thinkingTime?: number;
  winners?: string[];
  dateStart?: unknown;
}

export class GameEstimationQuestion extends GameQuestion {
  static REWARD = 1;
  static THINKING_TIME = 90;

  bets: EstimationBet[];
  dateStart: unknown;
  reward: number;
  thinkingTime: number;
  winners: string[];

  constructor(data: GameEstimationQuestionData) {
    super(data);
    this.bets = data.bets ?? [];
    this.dateStart = data.dateStart;
    this.reward = data.reward ?? GameEstimationQuestion.REWARD;
    this.thinkingTime = data.thinkingTime ?? GameEstimationQuestion.THINKING_TIME;
    this.winners = data.winners ?? [];
  }

  getQuestionType(): QuestionType {
    return QuestionType.ESTIMATION;
  }

  toObject(): Record<string, unknown> {
    return {
      ...super.toObject(),
      bets: this.bets,
      reward: this.reward,
      thinkingTime: this.thinkingTime,
      winners: this.winners,
    };
  }

  static validate(data: unknown): boolean {
    return GameQuestion.validate(data);
  }

  reset(): void {
    this.bets = [];
    this.winners = [];
  }
}
