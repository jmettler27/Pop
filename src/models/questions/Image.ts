import { BuzzerQuestion, GameBuzzerQuestion, type GameBuzzerQuestionData } from '@/models/questions/buzzer';
import { type BaseQuestionData } from '@/models/questions/question';
import { QuestionType } from '@/models/questions/question-type';

export interface ImageAnswer {
  source?: string;
  description?: string;
}

export interface ImageQuestionData extends BaseQuestionData {
  answer?: ImageAnswer;
  image?: string;
  title?: string;
  details?: { answer?: ImageAnswer; image?: string; title?: string };
}

export class ImageQuestion extends BuzzerQuestion {
  static TITLE_MAX_LENGTH = 75;
  static ANSWER_SOURCE_MAX_LENGTH = 75;
  static ANSWER_DESCRIPTION_MAX_LENGTH = 75;
  static ELEMENTS = ['source', 'description'];

  answer: ImageAnswer;
  image: string;
  title: string | undefined;

  constructor(data: ImageQuestionData) {
    super(data);
    const d = (data.details ?? {}) as ImageQuestionData;
    this.answer = data.answer ?? d.answer ?? {};
    this.image = data.image ?? d.image ?? '';
    this.title = data.title ?? d.title;
  }

  getQuestionType(): QuestionType {
    return QuestionType.IMAGE;
  }

  toObject(): Record<string, unknown> {
    return { ...super.toObject(), details: { answer: this.answer, image: this.image, title: this.title } };
  }

  setImage(imageUrl: string): void {
    this.image = imageUrl;
  }

  static validate(data: unknown): boolean {
    return BuzzerQuestion.validate(data);
  }
}

export interface GameImageQuestionData extends GameBuzzerQuestionData {
  thinkingTime?: number;
  reward?: number;
  maxTries?: number;
}

export class GameImageQuestion extends GameBuzzerQuestion {
  static THINKING_TIME = 15;
  static REWARD = 1;
  static MAX_TRIES = 2;

  thinkingTime: number;
  reward: number;
  maxTries: number;

  constructor(data: GameImageQuestionData) {
    super(data);
    this.thinkingTime = data.thinkingTime ?? GameImageQuestion.THINKING_TIME;
    this.reward = data.reward ?? GameImageQuestion.REWARD;
    this.maxTries = data.maxTries ?? GameImageQuestion.MAX_TRIES;
  }

  getQuestionType(): QuestionType {
    return QuestionType.IMAGE;
  }

  toObject(): Record<string, unknown> {
    return { ...super.toObject(), thinkingTime: this.thinkingTime, reward: this.reward, maxTries: this.maxTries };
  }

  static validate(data: unknown): boolean {
    return GameBuzzerQuestion.validate(data);
  }
}
