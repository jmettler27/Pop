import {
  BuzzerQuestion,
  GameBuzzerQuestion,
  type BuzzerQuestionData,
  type GameBuzzerQuestionData,
} from '@/models/questions/buzzer';
import { QuestionType } from '@/models/questions/question-type';

export const BlindtestType = {
  SONG: 'song',
  SOUND: 'sound',
} as const;

export type BlindtestType = (typeof BlindtestType)[keyof typeof BlindtestType];

export function isValidBlindtestType(type: string): type is BlindtestType {
  return (Object.values(BlindtestType) as string[]).includes(type);
}

export const BlindtestTypeToEmoji: Record<BlindtestType, string> = {
  [BlindtestType.SONG]: '🎵',
  [BlindtestType.SOUND]: '🔊',
};

export function blindtestTypeToEmoji(type: string | undefined): string {
  return type !== undefined && isValidBlindtestType(type) ? BlindtestTypeToEmoji[type] : '';
}

export interface BlindtestAnswer {
  title: string;
  author?: string;
  source?: string;
  image?: string;
}

export interface BlindtestQuestionData extends BuzzerQuestionData {
  answer?: BlindtestAnswer;
  audio?: string;
  subtype?: string;
  details?: { answer?: BlindtestAnswer; audio?: string; subtype?: string; title?: string };
}

export class BlindtestQuestion extends BuzzerQuestion {
  static TITLE_MAX_LENGTH = 50;
  static ANSWER_TITLE_MAX_LENGTH = 50;
  static ANSWER_SOURCE_MAX_LENGTH = 75;
  static ANSWER_AUTHOR_MAX_LENGTH = 50;
  static ELEMENTS = ['title', 'source', 'author'];

  answer: BlindtestAnswer;
  audio: string | undefined;
  subtype: string | undefined;

  constructor(data: BlindtestQuestionData) {
    super(data);
    const d = (data.details ?? {}) as BlindtestQuestionData;
    this.answer = data.answer ?? d.answer ?? ({} as BlindtestAnswer);
    this.audio = data.audio ?? d.audio;
    this.subtype = data.subtype ?? d.subtype;
  }

  getQuestionType(): QuestionType {
    return QuestionType.BLINDTEST;
  }

  toObject(): Record<string, unknown> {
    return {
      ...super.toObject(),
      details: { answer: this.answer, audio: this.audio ?? null, subtype: this.subtype, title: this.title },
    };
  }

  setImage(imageUrl: string): void {
    this.answer.image = imageUrl;
  }

  setAudio(audioUrl: string): void {
    this.audio = audioUrl;
  }

  static validate(data: unknown): boolean {
    return BuzzerQuestion.validate(data);
  }
}

export interface GameBlindtestQuestionData extends GameBuzzerQuestionData {
  thinkingTime?: number;
  reward?: number;
  maxTries?: number;
}

export class GameBlindtestQuestion extends GameBuzzerQuestion {
  static THINKING_TIME = 15;
  static REWARD = 1;
  static MAX_TRIES = 2;

  thinkingTime: number;
  reward: number;
  maxTries: number;

  constructor(data: GameBlindtestQuestionData) {
    super(data);
    this.thinkingTime = data.thinkingTime ?? GameBlindtestQuestion.THINKING_TIME;
    this.reward = data.reward ?? GameBlindtestQuestion.REWARD;
    this.maxTries = data.maxTries ?? GameBlindtestQuestion.MAX_TRIES;
  }

  getQuestionType(): QuestionType {
    return QuestionType.BLINDTEST;
  }

  toObject(): Record<string, unknown> {
    return { ...super.toObject(), thinkingTime: this.thinkingTime, reward: this.reward, maxTries: this.maxTries };
  }

  static validate(data: unknown): boolean {
    return GameBuzzerQuestion.validate(data);
  }
}
