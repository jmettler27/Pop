import { BuzzerQuestion, GameBuzzerQuestion, type GameBuzzerQuestionData } from '@/models/questions/buzzer';
import { type BaseQuestionData } from '@/models/questions/question';
import { QuestionType } from '@/models/questions/question-type';

export interface EmojiAnswer {
  title: string;
  image?: string;
}

export interface EmojiQuestionData extends BaseQuestionData {
  answer?: EmojiAnswer;
  clue?: string;
  title?: string;
  details?: { answer?: EmojiAnswer; clue?: string; title?: string };
}

export class EmojiQuestion extends BuzzerQuestion {
  static TITLE_MAX_LENGTH = 50;
  static CLUE_MIN_LENGTH = 1;
  static CLUE_MAX_LENGTH = 10;
  static ANSWER_TITLE_MAX_LENGTH = 50;

  answer: EmojiAnswer;
  clue: string | undefined;
  title: string | undefined;

  constructor(data: EmojiQuestionData) {
    super(data);
    const d = (data.details ?? {}) as EmojiQuestionData;
    this.answer = data.answer ?? d.answer ?? ({ title: '' } as EmojiAnswer);
    this.clue = data.clue ?? d.clue;
    this.title = data.title ?? d.title;
  }

  getQuestionType(): QuestionType {
    return QuestionType.EMOJI;
  }

  toObject(): Record<string, unknown> {
    return { ...super.toObject(), details: { answer: this.answer, clue: this.clue, title: this.title } };
  }

  setImage(imageUrl: string): void {
    this.answer.image = imageUrl;
  }

  static validate(data: unknown): boolean {
    return BuzzerQuestion.validate(data);
  }

  getClue(): string | undefined {
    return this.clue;
  }
}

export interface GameEmojiQuestionData extends GameBuzzerQuestionData {
  reward?: number;
  maxTries?: number;
  thinkingTime?: number;
}

export class GameEmojiQuestion extends GameBuzzerQuestion {
  static REWARD = 1;
  static MAX_TRIES = 2;
  static THINKING_TIME = 15;

  reward: number;
  maxTries: number;
  thinkingTime: number;

  constructor(data: GameEmojiQuestionData) {
    super(data);
    this.reward = data.reward ?? GameEmojiQuestion.REWARD;
    this.maxTries = data.maxTries ?? GameEmojiQuestion.MAX_TRIES;
    this.thinkingTime = data.thinkingTime ?? GameEmojiQuestion.THINKING_TIME;
  }

  getQuestionType(): QuestionType {
    return QuestionType.EMOJI;
  }

  toObject(): Record<string, unknown> {
    return { ...super.toObject(), reward: this.reward, maxTries: this.maxTries, thinkingTime: this.thinkingTime };
  }

  static validate(data: unknown): boolean {
    return GameBuzzerQuestion.validate(data);
  }
}
