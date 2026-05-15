import { BaseQuestion, GameQuestion, type BaseQuestionData, type GameQuestionData } from '@/models/questions/question';
import { QuestionType } from '@/models/questions/question-type';

export interface ReorderingItem {
  title: string;
  explanation?: string;
}

export interface ReorderingQuestionData extends BaseQuestionData {
  items?: ReorderingItem[];
  title?: string;
  note?: string;
  details?: { items?: ReorderingItem[]; title?: string; note?: string };
}

export class ReorderingQuestion extends BaseQuestion {
  static TITLE_MAX_LENGTH = 75;
  static NOTE_MAX_LENGTH = 500;
  static MIN_NUM_ITEMS = 3;
  static MAX_NUM_ITEMS = 20;
  static ITEM_TITLE_MAX_LENGTH = 75;
  static ITEM_EXPLANATION_MAX_LENGTH = 150;

  items: ReorderingItem[] | undefined;
  title: string | undefined;
  note: string | undefined;

  constructor(data: ReorderingQuestionData) {
    super(data);
    const d = (data.details ?? {}) as ReorderingQuestionData;
    this.items = data.items ?? d.items;
    this.title = data.title ?? d.title;
    this.note = data.note ?? d.note;
  }

  getQuestionType(): QuestionType {
    return QuestionType.REORDERING;
  }

  toObject(): Record<string, unknown> {
    return { ...super.toObject(), details: { items: this.items, title: this.title, note: this.note } };
  }

  static validate(data: unknown): boolean {
    return BaseQuestion.validate(data);
  }

  setImage(_imageUrl: string): void {}
  setAudio(_audioUrl: string): void {}
}

export type SubmittedOrdering = number[];

export interface Ordering {
  ordering: SubmittedOrdering;
  playerId: string;
  score: number;
  submittedAt: unknown;
  teamId: string;
}

export interface GameReorderingQuestionData extends GameQuestionData {
  thinkingTime?: number;
  orderings?: Ordering[];
}

export class GameReorderingQuestion extends GameQuestion {
  static THINKING_TIME = 60;

  thinkingTime: number;
  orderings: Ordering[];

  constructor(data: GameReorderingQuestionData) {
    super(data);
    this.thinkingTime = data.thinkingTime ?? GameReorderingQuestion.THINKING_TIME;
    this.orderings = data.orderings ?? [];
  }

  getQuestionType(): QuestionType {
    return QuestionType.REORDERING;
  }

  toObject(): Record<string, unknown> {
    return { ...super.toObject(), thinkingTime: this.thinkingTime, orderings: this.orderings };
  }

  static validate(data: unknown): boolean {
    return GameQuestion.validate(data);
  }

  reset(): void {
    this.orderings = [];
  }
}
