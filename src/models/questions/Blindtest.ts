import { DEFAULT_LOCALE, type Locale } from '@/frontend/helpers/locales';
import { BuzzerQuestion, GameBuzzerQuestion, type GameBuzzerQuestionData } from '@/models/questions/buzzer';
import { type BaseQuestionData } from '@/models/questions/question';
import { QuestionType } from '@/models/questions/question-type';

export class BlindtestType {
  static SONG = 'song';
  static SOUND = 'sound';

  static TRANSLATIONS: Record<string, { en: string; fr: string; emoji: string }> = {
    [BlindtestType.SONG]: { en: 'Music', fr: 'Musique', emoji: '🎵' },
    [BlindtestType.SOUND]: { en: 'Sound', fr: 'Son', emoji: '🔊' },
  };

  static getEmoji(type: string): string {
    return this.TRANSLATIONS[type]?.emoji ?? '';
  }

  static getTitle(type: string, lang: Locale = DEFAULT_LOCALE): string {
    return this.TRANSLATIONS[type]?.[lang] ?? '';
  }

  static getAllTypes(): string[] {
    return Object.keys(this.TRANSLATIONS);
  }

  static isValid(type: string): boolean {
    return type in this.TRANSLATIONS;
  }
}

export interface BlindtestAnswer {
  title: string;
  author?: string;
  source?: string;
  image?: string;
}

export interface BlindtestQuestionData extends BaseQuestionData {
  answer?: BlindtestAnswer;
  audio?: string;
  subtype?: string;
  title?: string;
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
  title: string | undefined;

  constructor(data: BlindtestQuestionData) {
    super(data);
    const d = (data.details ?? {}) as BlindtestQuestionData;
    this.answer = data.answer ?? d.answer ?? ({} as BlindtestAnswer);
    this.audio = data.audio ?? d.audio;
    this.subtype = data.subtype ?? d.subtype;
    this.title = data.title ?? d.title;
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

  static typeToEmoji(type: string): string {
    return BlindtestType.getEmoji(type);
  }

  static typeToTitle(type: string, lang: Locale = DEFAULT_LOCALE): string {
    return BlindtestType.getTitle(type, lang);
  }

  static prependTypeWithEmoji(type: string, lang: Locale = DEFAULT_LOCALE): string {
    return `${this.typeToEmoji(type)} ${this.typeToTitle(type, lang)}`;
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
