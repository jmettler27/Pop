import { BuzzerQuestion, GameBuzzerQuestion, type GameBuzzerQuestionData } from '@/models/questions/buzzer';
import { type BaseQuestionData } from '@/models/questions/question';
import { QuestionType } from '@/models/questions/question-type';

export interface ProgressiveCluesAnswer {
  title: string;
  image?: string;
}

export interface ProgressiveCluesQuestionData extends BaseQuestionData {
  answer?: ProgressiveCluesAnswer;
  clues?: string[];
  title?: string;
  details?: { answer?: ProgressiveCluesAnswer; clues?: string[]; title?: string };
}

export class ProgressiveCluesQuestion extends BuzzerQuestion {
  static TITLE_MAX_LENGTH = 50;
  static ANSWER_TITLE_MAX_LENGTH = 100;
  static CLUE_MAX_LENGTH = 150;
  static MIN_NUM_CLUES = 2;
  static MAX_NUM_CLUES = 10;

  answer: ProgressiveCluesAnswer;
  clues: string[] | undefined;
  title: string | undefined;

  constructor(data: ProgressiveCluesQuestionData) {
    super(data);
    const d = (data.details ?? {}) as ProgressiveCluesQuestionData;
    this.answer = data.answer ?? d.answer ?? ({ title: '' } as ProgressiveCluesAnswer);
    this.clues = data.clues ?? d.clues;
    this.title = data.title ?? d.title;
  }

  getQuestionType(): QuestionType {
    return QuestionType.PROGRESSIVE_CLUES;
  }

  toObject(): Record<string, unknown> {
    return { ...super.toObject(), details: { answer: this.answer, clues: this.clues, title: this.title } };
  }

  setImage(imageUrl: string): void {
    this.answer.image = imageUrl;
  }

  static validate(data: unknown): boolean {
    return BuzzerQuestion.validate(data);
  }

  getClue(idx: number): string | undefined {
    return this.clues?.[idx];
  }
}

export interface GameProgressiveCluesQuestionData extends GameBuzzerQuestionData {
  reward?: number;
  maxTries?: number;
  thinkingTime?: number;
  currentClueIdx?: number;
  delay?: number;
}

export class GameProgressiveCluesQuestion extends GameBuzzerQuestion {
  static REWARD = 1;
  static MAX_TRIES = 2;
  static THINKING_TIME = 15;
  static DEFAULT_DELAY = 2;

  reward: number;
  maxTries: number;
  thinkingTime: number;
  currentClueIdx: number | undefined;
  delay: number;

  constructor(data: GameProgressiveCluesQuestionData) {
    super(data);
    this.reward = data.reward ?? GameProgressiveCluesQuestion.REWARD;
    this.maxTries = data.maxTries ?? GameProgressiveCluesQuestion.MAX_TRIES;
    this.thinkingTime = data.thinkingTime ?? GameProgressiveCluesQuestion.THINKING_TIME;
    this.currentClueIdx = data.currentClueIdx;
    this.delay = data.delay ?? GameProgressiveCluesQuestion.DEFAULT_DELAY;
  }

  getQuestionType(): QuestionType {
    return QuestionType.PROGRESSIVE_CLUES;
  }

  toObject(): Record<string, unknown> {
    return {
      ...super.toObject(),
      currentClueIdx: this.currentClueIdx,
      thinkingTime: this.thinkingTime,
      reward: this.reward,
      maxTries: this.maxTries,
      delay: this.delay,
    };
  }

  static validate(data: unknown): boolean {
    return GameBuzzerQuestion.validate(data);
  }

  getCurrentClueIdx(): number | undefined {
    return this.currentClueIdx;
  }

  incrementClueIdx(): void {
    this.currentClueIdx = (this.currentClueIdx ?? -1) + 1;
  }

  reset(): void {
    super.reset();
    this.currentClueIdx = -1;
    this.winner = {};
  }
}
