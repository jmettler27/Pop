import { BuzzerQuestion, GameBuzzerQuestion, type GameBuzzerQuestionData } from '@/models/questions/buzzer';
import { BaseQuestion, type BaseQuestionData } from '@/models/questions/question';
import { QuestionType } from '@/models/questions/question-type';

export interface BasicQuestionData extends BaseQuestionData {
  answer?: string;
  explanation?: string;
  note?: string;
  source?: string;
  title?: string;
  details?: { answer?: string; explanation?: string; note?: string; source?: string; title?: string };
}

export class BasicQuestion extends BuzzerQuestion {
  static TITLE_MAX_LENGTH = 200;
  static NOTE_MAX_LENGTH = 200;
  static EXPLANATION_MAX_LENGTH = 200;
  static ANSWER_MAX_LENGTH = 100;
  static SOURCE_MAX_LENGTH = 75;

  answer: string | undefined;
  explanation: string | undefined;
  note: string | undefined;
  source: string | undefined;
  title: string | undefined;

  constructor(data: BasicQuestionData) {
    super(data);
    const d = data.details ?? {};
    this.answer = data.answer ?? d.answer;
    this.explanation = data.explanation ?? d.explanation;
    this.note = data.note ?? d.note;
    this.source = data.source ?? d.source;
    this.title = data.title ?? d.title;
  }

  getQuestionType(): QuestionType {
    return QuestionType.BASIC;
  }

  toObject(): Record<string, unknown> {
    return {
      ...super.toObject(),
      details: {
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
}

export interface GameBasicQuestionData extends GameBuzzerQuestionData {
  reward?: number;
  thinkingTime?: number;
}

export class GameBasicQuestion extends GameBuzzerQuestion {
  static REWARD = 1;
  static THINKING_TIME = 15;

  reward: number;
  thinkingTime: number;

  constructor(data: GameBasicQuestionData) {
    super(data);
    this.reward = data.reward ?? GameBasicQuestion.REWARD;
    this.thinkingTime = data.thinkingTime ?? GameBasicQuestion.THINKING_TIME;
  }

  getQuestionType(): QuestionType {
    return QuestionType.BASIC;
  }

  toObject(): Record<string, unknown> {
    return { ...super.toObject(), reward: this.reward, thinkingTime: this.thinkingTime };
  }

  static validate(data: unknown): boolean {
    return GameBuzzerQuestion.validate(data);
  }
}
