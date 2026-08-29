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

  // The stored order of `items` *is* the answer, so players never get `toObject()`.
  // `PlayableQuestionService` replaces `items` with a shuffled, explanation-free copy;
  // the client then submits its ordering by item title, not by index.
  toPlayableObject(): Record<string, unknown> {
    const shuffled = shuffleReorderingItems(this.items ?? []);
    return { ...super.toObject(), details: { items: shuffled, title: this.title, note: this.note } };
  }

  static validate(data: unknown): boolean {
    return BaseQuestion.validate(data);
  }

  setImage(_imageUrl: string): void {}
  setAudio(_audioUrl: string): void {}
}

/** A copy of the items in random order with explanations dropped — never the stored order. */
export function shuffleReorderingItems(items: ReorderingItem[]): Array<{ title: string }> {
  const out = items.map((it) => ({ title: it.title }));
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  // Never hand back the canonical order.
  if (out.length > 1 && out.every((it, i) => it.title === items[i]!.title)) {
    [out[0], out[1]] = [out[1]!, out[0]!];
  }
  return out;
}

export type SubmittedOrdering = number[];

export interface Ordering {
  ordering: SubmittedOrdering;
  /** The item titles in the order the team submitted — lets a teammate's client show the
   *  submission while it still only has the shuffled item list (no canonical indices). */
  submittedTitles?: string[];
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
