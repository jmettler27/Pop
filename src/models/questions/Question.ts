import { Locale } from '@/frontend/helpers/locales';
import { isValidQuestionType, type QuestionType } from '@/models/questions/question-type';
import { isValidTopic, type Topic } from '@/models/topic';

export interface QuestionData {
  id?: string;
  type?: QuestionType;
}

export interface BaseQuestionData extends QuestionData {
  topic?: Topic;
  approved?: boolean;
  createdAt?: unknown;
  createdBy?: string;
  lang?: Locale;
  details?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface CreateBaseQuestionData {
  type: QuestionType;
  topic: Topic;
  lang: Locale;
  approved: boolean;
  createdAt: unknown;
  createdBy: string;
  details?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface UpdateBaseQuestionData {
  topic: Topic;
  lang: Locale;
  approved: boolean;
  details?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface GameQuestionData extends QuestionData {
  dateEnd?: unknown;
  dateStart?: unknown;
  managedBy?: string;
  thinkingTime?: number;
  [key: string]: unknown;
}

export abstract class Question {
  id: string | undefined;
  type: QuestionType;

  constructor(data: QuestionData) {
    this.id = data.id;
    this.type = (data.type as QuestionType) || this.getQuestionType();
  }

  toObject(): Record<string, unknown> {
    return { type: this.type };
  }

  abstract getQuestionType(): QuestionType;

  static validate(data: unknown): boolean {
    if (!data) throw new Error('Question data is required');
    Question.validateId(data as QuestionData);
    return true;
  }

  static validateId(data: QuestionData): boolean {
    const id = data.id;
    if (id && typeof id !== 'string') throw new Error('Question ID must be a string');
    return true;
  }

  static validateType(data: QuestionData): boolean {
    const type = data.type;
    if (!type) throw new Error('Question type is required');
    if (typeof type !== 'string') throw new Error('Question type must be a string');
    if (!isValidQuestionType(type)) throw new Error(`Invalid question type: ${type}`);
    return true;
  }
}

export abstract class BaseQuestion extends Question {
  topic: Topic | undefined;
  approved: boolean | undefined;
  createdAt: unknown;
  createdBy: string | undefined;
  lang: Locale | undefined;

  constructor(data: BaseQuestionData) {
    super(data);
    this.topic = data.topic;
    this.approved = data.approved;
    this.createdAt = data.createdAt ?? null;
    this.createdBy = data.createdBy;
    this.lang = data.lang;
  }

  toObject(): Record<string, unknown> {
    return {
      ...super.toObject(),
      topic: this.topic,
      approved: this.approved,
      createdAt: this.createdAt,
      createdBy: this.createdBy,
      lang: this.lang,
    };
  }

  static validate(data: unknown): boolean {
    Question.validate(data);
    const d = data as BaseQuestionData;
    BaseQuestion.validateTopic(d);
    BaseQuestion.validateApproved(d);
    BaseQuestion.validateCreatedBy(d);
    BaseQuestion.validateLang(d);
    return true;
  }

  static validateTopic(data: BaseQuestionData): boolean {
    const topic = data.topic;
    if (!topic) throw new Error('Question topic is required');
    if (typeof topic !== 'string') throw new Error('Question topic must be a string');
    if (!isValidTopic(topic)) throw new Error(`Invalid question topic: ${topic}`);
    return true;
  }

  static validateApproved(data: BaseQuestionData): boolean {
    const approved = data.approved;
    if (approved === undefined) throw new Error('Question approved is required');
    if (typeof approved !== 'boolean') throw new Error('Question approved must be a boolean');
    return true;
  }

  static validateCreatedBy(data: BaseQuestionData): boolean {
    const createdBy = data.createdBy;
    if (createdBy === undefined) throw new Error('Question createdBy is required');
    if (typeof createdBy !== 'string') throw new Error('Question createdBy must be a string');
    return true;
  }

  static validateLang(data: BaseQuestionData): boolean {
    const lang = data.lang;
    if (lang === undefined) throw new Error('Question lang is required');
    if (typeof lang !== 'string') throw new Error('Question lang must be a string');
    return true;
  }

  setImage(_imageUrl: string): void {
    throw new Error('setImage is not implemented');
  }

  setAudio(_audioUrl: string): void {
    throw new Error('setAudio is not implemented');
  }
}

export abstract class GameQuestion extends Question {
  dateEnd: unknown;
  dateStart: unknown;
  managedBy: string | undefined;
  thinkingTime: number | undefined;

  constructor(data: GameQuestionData) {
    super(data);
    this.dateEnd = data.dateEnd;
    this.dateStart = data.dateStart;
    this.managedBy = data.managedBy;
    this.thinkingTime = data.thinkingTime;
  }

  toObject(): Record<string, unknown> {
    return {
      ...super.toObject(),
      dateEnd: this.dateEnd ?? null,
      dateStart: this.dateStart ?? null,
      managedBy: this.managedBy,
      thinkingTime: this.thinkingTime,
    };
  }

  static validate(data: unknown): boolean {
    Question.validate(data);
    return true;
  }

  abstract reset(): void;
}
