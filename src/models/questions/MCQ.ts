import { BaseQuestion, GameQuestion, type BaseQuestionData, type GameQuestionData } from '@/models/questions/question';
import { QuestionType } from '@/models/questions/question-type';

export interface MCQQuestionData extends BaseQuestionData {
  choices?: string[];
  answerIdx?: number;
  source?: string;
  title?: string;
  note?: string;
  explanation?: string;
  details?: {
    choices?: string[];
    answerIdx?: number;
    source?: string;
    title?: string;
    note?: string;
    explanation?: string;
  };
}

export class MCQQuestion extends BaseQuestion {
  static CHOICES = ['A', 'B', 'C', 'D'];
  static MIN_CHOICES = 2;
  static MAX_CHOICES = 4;
  static CHOICE_MAX_LENGTH = 100;
  static SOURCE_MAX_LENGTH = 50;
  static TITLE_MAX_LENGTH = 125;
  static NOTE_MAX_LENGTH = 500;
  static EXPLANATION_MAX_LENGTH = 500;

  choices: string[] | undefined;
  answerIdx: number | undefined;
  source: string | undefined;
  title: string | undefined;
  note: string | undefined;
  explanation: string | undefined;

  constructor(data: MCQQuestionData) {
    super(data);
    const d = (data.details ?? {}) as MCQQuestionData;
    this.choices = data.choices ?? d.choices;
    this.answerIdx = data.answerIdx ?? d.answerIdx;
    this.source = data.source ?? d.source;
    this.title = data.title ?? d.title;
    this.note = data.note ?? d.note;
    this.explanation = data.explanation ?? d.explanation;
  }

  getQuestionType(): QuestionType {
    return QuestionType.MCQ;
  }

  toObject(): Record<string, unknown> {
    return {
      ...super.toObject(),
      details: {
        choices: this.choices,
        answerIdx: this.answerIdx,
        source: this.source,
        title: this.title,
        note: this.note,
        explanation: this.explanation,
      },
    };
  }

  setImage(imageUrl: string): void {
    (this as unknown as Record<string, unknown>).image = imageUrl;
  }

  setAudio(audioUrl: string): void {
    (this as unknown as Record<string, unknown>).audio = audioUrl;
  }

  static validate(data: unknown): boolean {
    return BaseQuestion.validate(data);
  }

  isValidAnswer(idx: number): boolean {
    return idx === this.answerIdx;
  }
}

export interface GameMCQQuestionData extends GameQuestionData {
  thinkingTime?: number;
  correct?: boolean | null;
  choiceIdx?: number | null;
  playerId?: string | null;
  reward?: number | null;
  teamId?: string | null;
}

export class GameMCQQuestion extends GameQuestion {
  static THINKING_TIME = 30;
  static REWARD = 1;

  thinkingTime: number;
  correct: boolean | null | undefined;
  choiceIdx: number | null;
  playerId: string | null;
  reward: number | null;
  teamId: string | null;

  constructor(data: GameMCQQuestionData) {
    super(data);
    this.thinkingTime = data.thinkingTime ?? GameMCQQuestion.THINKING_TIME;
    this.correct = data.correct;
    this.choiceIdx = data.choiceIdx ?? null;
    this.playerId = data.playerId ?? null;
    this.reward = data.reward ?? null;
    this.teamId = data.teamId ?? null;
  }

  getQuestionType(): QuestionType {
    return QuestionType.MCQ;
  }

  toObject(): Record<string, unknown> {
    return {
      ...super.toObject(),
      thinkingTime: this.thinkingTime,
      correct: this.correct,
      choiceIdx: this.choiceIdx,
      playerId: this.playerId,
      reward: this.reward,
      teamId: this.teamId,
    };
  }

  static validate(data: unknown): boolean {
    return GameQuestion.validate(data);
  }

  reset(): void {
    this.correct = null;
    this.choiceIdx = null;
    this.playerId = null;
    this.reward = null;
    this.teamId = null;
  }
}
