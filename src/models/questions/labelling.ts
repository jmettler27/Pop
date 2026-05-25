import { isObjectEmpty } from '@/backend/utils/objects';
import { BaseQuestion, GameQuestion, type BaseQuestionData, type GameQuestionData } from '@/models/questions/question';
import { QuestionType } from '@/models/questions/question-type';

export interface LabellingQuestionData extends BaseQuestionData {
  title?: string;
  note?: string;
  image?: string;
  labels?: string[];
  details?: { title?: string; note?: string; image?: string; labels?: string[] };
}

export class LabellingQuestion extends BaseQuestion {
  static TITLE_MAX_LENGTH = 50;
  static NOTE_MAX_LENGTH = 500;
  static LABEL_MAX_LENGTH = 50;
  static MIN_NUM_LABELS = 2;
  static MAX_NUM_LABELS = 50;

  title: string | undefined;
  note: string | undefined;
  image: string;
  labels: string[] | undefined;

  constructor(data: LabellingQuestionData) {
    super(data);
    const d = (data.details ?? {}) as LabellingQuestionData;
    this.title = data.title ?? d.title;
    this.note = data.note ?? d.note;
    this.image = data.image ?? d.image ?? '';
    this.labels = data.labels ?? d.labels;
  }

  getQuestionType(): QuestionType {
    return QuestionType.LABELLING;
  }

  toObject(): Record<string, unknown> {
    return {
      ...super.toObject(),
      details: { title: this.title, note: this.note, image: this.image, labels: this.labels },
    };
  }

  setImage(imageUrl: string): void {
    this.image = imageUrl;
  }

  static validate(data: unknown): boolean {
    return BaseQuestion.validate(data);
  }

  getInitialRevealed(): Record<string, unknown>[] {
    return (this.labels ?? []).map(() => ({}));
  }

  getAllLabelsRevealed(playerId: string): Array<{ playerId: string; timestamp: Date }> {
    return (this.labels ?? []).map(() => ({ playerId, timestamp: new Date() }));
  }

  isAllRevealed(revealed: Record<string, unknown>[]): boolean {
    return revealed.every((label) => Object.keys(label).length > 0);
  }

  calculatePoints(rewardsPerElement: number): number {
    return (this.labels?.length ?? 0) * rewardsPerElement;
  }
}

export interface GameLabellingQuestionData extends GameQuestionData {
  revealed?: Record<string, unknown>[];
  reward?: number;
  maxTries?: number;
  thinkingTime?: number;
}

export class GameLabellingQuestion extends GameQuestion {
  static REWARD = 1;
  static MAX_TRIES = 1;
  static THINKING_TIME = 30;

  revealed: Record<string, unknown>[];
  reward: number;
  maxTries: number;
  thinkingTime: number;

  constructor(data: GameLabellingQuestionData) {
    super(data);
    this.revealed = data.revealed ?? [];
    this.reward = data.reward ?? GameLabellingQuestion.REWARD;
    this.maxTries = data.maxTries ?? GameLabellingQuestion.MAX_TRIES;
    this.thinkingTime = data.thinkingTime ?? GameLabellingQuestion.THINKING_TIME;
  }

  getQuestionType(): QuestionType {
    return QuestionType.LABELLING;
  }

  toObject(): Record<string, unknown> {
    return {
      ...super.toObject(),
      revealed: this.revealed,
      reward: this.reward,
      maxTries: this.maxTries,
      thinkingTime: this.thinkingTime,
    };
  }

  static validate(data: unknown): boolean {
    return GameQuestion.validate(data);
  }

  atLeastOneLabelIsRevealed(): boolean {
    return this.revealed.some((r) => !isObjectEmpty(r as Record<string, unknown>));
  }

  labelIsRevealed(labelIdx: number): boolean {
    const r = this.revealed[labelIdx];
    return !!r && !isObjectEmpty(r as Record<string, unknown>);
  }

  reset(): void {
    this.revealed = [];
  }
}
