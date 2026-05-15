import { BaseQuestion, GameQuestion, type BaseQuestionData, type GameQuestionData } from '@/models/questions/question';
import { QuestionType } from '@/models/questions/question-type';

export interface OddOneOutItem {
  title: string;
  explanation: string;
}

export interface OddOneOutQuestionData extends BaseQuestionData {
  items?: OddOneOutItem[];
  answerIdx?: number;
  title?: string;
  note?: string;
  details?: { items?: OddOneOutItem[]; answerIdx?: number; title?: string; note?: string };
}

export class OddOneOutQuestion extends BaseQuestion {
  static TITLE_MAX_LENGTH = 75;
  static NOTE_MAX_LENGTH = 500;
  static MIN_NUM_ITEMS = 5;
  static MAX_NUM_ITEMS = 10;
  static ITEM_TITLE_MAX_LENGTH = 100;
  static ITEM_EXPLANATION_MAX_LENGTH = 150;

  items: OddOneOutItem[] | undefined;
  answerIdx: number | undefined;
  title: string | undefined;
  note: string | undefined;

  constructor(data: OddOneOutQuestionData) {
    super(data);
    const d = (data.details ?? {}) as OddOneOutQuestionData;
    this.items = data.items ?? d.items;
    this.answerIdx = data.answerIdx ?? d.answerIdx;
    this.title = data.title ?? d.title;
    this.note = data.note ?? d.note;
  }

  getQuestionType(): QuestionType {
    return QuestionType.ODD_ONE_OUT;
  }

  toObject(): Record<string, unknown> {
    return {
      ...super.toObject(),
      details: { items: this.items, answerIdx: this.answerIdx, title: this.title, note: this.note },
    };
  }

  static validate(data: unknown): boolean {
    return BaseQuestion.validate(data);
  }

  setImage(_imageUrl: string): void {}
  setAudio(_audioUrl: string): void {}

  isValidAnswer(idx: number): boolean {
    return idx === this.answerIdx;
  }
}

export interface SelectedItem {
  idx: number;
  playerId: string;
  timestamp: unknown;
}

export interface GameOddOneOutQuestionData extends GameQuestionData {
  thinkingTime?: number;
  selectedItems?: SelectedItem[];
}

export class GameOddOneOutQuestion extends GameQuestion {
  static DEFAULT_MISTAKE_PENALTY = 1;
  static THINKING_TIME = 30;

  thinkingTime: number;
  selectedItems: SelectedItem[];

  constructor(data: GameOddOneOutQuestionData) {
    super(data);
    this.thinkingTime = data.thinkingTime ?? GameOddOneOutQuestion.THINKING_TIME;
    this.selectedItems = data.selectedItems ?? [];
  }

  getQuestionType(): QuestionType {
    return QuestionType.ODD_ONE_OUT;
  }

  toObject(): Record<string, unknown> {
    return { ...super.toObject(), thinkingTime: this.thinkingTime, selectedItems: this.selectedItems };
  }

  static validate(data: unknown): boolean {
    return GameQuestion.validate(data);
  }

  reset(): void {
    this.selectedItems = [];
  }
}
