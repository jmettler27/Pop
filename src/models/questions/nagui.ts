import { DEFAULT_LOCALE, type Locale } from '@/frontend/helpers/locales';
import { prependWithEmojiAndSpace } from '@/frontend/helpers/strings';
import { BaseQuestion, GameQuestion, type BaseQuestionData, type GameQuestionData } from '@/models/questions/question';
import { QuestionType } from '@/models/questions/question-type';

export class NaguiOption {
  static TYPE_TO_TITLE: Record<Locale, string> = { en: '', fr: '' };
  static TYPE_TO_EMOJI = '';

  static typeToEmoji(): string {
    return this.TYPE_TO_EMOJI;
  }
  static typeToTitle(lang: Locale = DEFAULT_LOCALE): string {
    return this.TYPE_TO_TITLE[lang];
  }
  static prependTypeWithEmoji(lang: Locale = DEFAULT_LOCALE): string {
    return prependWithEmojiAndSpace(this.typeToEmoji(), this.typeToTitle(lang));
  }
}

export class HideNaguiOption extends NaguiOption {
  static TYPE = 'hide';
  static TYPE_TO_TITLE: Record<Locale, string> = { en: 'Hide', fr: 'Cache' };
  static TYPE_TO_EMOJI = '🙈';
}

export class SquareNaguiOption extends NaguiOption {
  static TYPE = 'square';
  static TYPE_TO_TITLE: Record<Locale, string> = { en: 'Square', fr: 'Carré' };
  static TYPE_TO_EMOJI = '4️⃣';
}

export class DuoNaguiOption extends NaguiOption {
  static TYPE = 'duo';
  static TYPE_TO_TITLE: Record<Locale, string> = { en: 'Duo', fr: 'Duo' };
  static TYPE_TO_EMOJI = '2️⃣';
}

export interface NaguiQuestionData extends BaseQuestionData {
  choices?: string[];
  answerIdx?: number;
  duoIdx?: number;
  source?: string;
  title?: string;
  note?: string;
  explanation?: string;
  details?: {
    choices?: string[];
    answerIdx?: number;
    duoIdx?: number;
    source?: string;
    title?: string;
    note?: string;
    explanation?: string;
  };
}

type NaguiOptionClass = typeof HideNaguiOption | typeof SquareNaguiOption | typeof DuoNaguiOption;

export class NaguiQuestion extends BaseQuestion {
  static CHOICES = ['A', 'B', 'C', 'D'];
  static MIN_CHOICES = 2;
  static MAX_CHOICES = 4;
  static CHOICE_MAX_LENGTH = 100;
  static TITLE_MAX_LENGTH = 125;
  static NOTE_MAX_LENGTH = 500;
  static EXPLANATION_MAX_LENGTH = 500;
  static SOURCE_MAX_LENGTH = 50;
  static OPTIONS: Record<string, NaguiOptionClass> = {
    hide: HideNaguiOption,
    square: SquareNaguiOption,
    duo: DuoNaguiOption,
  };

  choices: string[] | undefined;
  answerIdx: number | undefined;
  duoIdx: number | undefined;
  source: string | undefined;
  title: string | undefined;
  note: string | undefined;
  explanation: string | undefined;

  constructor(data: NaguiQuestionData) {
    super(data);
    const d = (data.details ?? {}) as NaguiQuestionData;
    this.choices = data.choices ?? d.choices;
    this.answerIdx = data.answerIdx ?? d.answerIdx;
    this.duoIdx = data.duoIdx ?? d.duoIdx;
    this.source = data.source ?? d.source;
    this.title = data.title ?? d.title;
    this.note = data.note ?? d.note;
    this.explanation = data.explanation ?? d.explanation;
  }

  getQuestionType(): QuestionType {
    return QuestionType.NAGUI;
  }

  toObject(): Record<string, unknown> {
    return {
      ...super.toObject(),
      details: {
        choices: this.choices,
        answerIdx: this.answerIdx,
        duoIdx: this.duoIdx,
        source: this.source,
        title: this.title,
        note: this.note,
        explanation: this.explanation,
      },
    };
  }

  setImage(imageUrl: string): void {
    (this as Record<string, unknown>).image = imageUrl;
  }
  setAudio(audioUrl: string): void {
    (this as Record<string, unknown>).audio = audioUrl;
  }

  static validate(data: unknown): boolean {
    return BaseQuestion.validate(data);
  }

  isValidAnswer(idx: number): boolean {
    return idx === this.answerIdx;
  }

  static typeToEmoji(type: string): string {
    return this.OPTIONS[type]?.TYPE_TO_EMOJI ?? '';
  }
  static typeToTitle(type: string, lang: Locale = DEFAULT_LOCALE): string {
    return this.OPTIONS[type]?.TYPE_TO_TITLE[lang] ?? '';
  }
  static prependTypeWithEmoji(type: string, lang: Locale = DEFAULT_LOCALE): string {
    return `${this.OPTIONS[type]?.TYPE_TO_EMOJI ?? ''} ${this.OPTIONS[type]?.TYPE_TO_TITLE[lang] ?? ''}`;
  }
}

export interface GameNaguiQuestionData extends GameQuestionData {
  thinkingTime?: number;
  correct?: boolean | null;
  option?: string | null;
  playerId?: string | null;
  reward?: number | null;
  teamId?: string | null;
  choiceIdx?: number | null;
}

export class GameNaguiQuestion extends GameQuestion {
  static REWARDS: Record<string, number> = { hide: 5, square: 3, duo: 2 };
  static NAGUI_OPTIONS = ['hide', 'square', 'duo'];
  static THINKING_TIME = 30;

  thinkingTime: number;
  correct: boolean | null | undefined;
  option: string | null;
  playerId: string | null;
  reward: number | null;
  teamId: string | null;
  choiceIdx: number | null;

  constructor(data: GameNaguiQuestionData) {
    super(data);
    this.thinkingTime = data.thinkingTime ?? GameNaguiQuestion.THINKING_TIME;
    this.correct = data.correct;
    this.option = data.option ?? null;
    this.playerId = data.playerId ?? null;
    this.reward = data.reward ?? null;
    this.teamId = data.teamId ?? null;
    this.choiceIdx = data.choiceIdx ?? null;
  }

  getQuestionType(): QuestionType {
    return QuestionType.NAGUI;
  }

  toObject(): Record<string, unknown> {
    return {
      ...super.toObject(),
      thinkingTime: this.thinkingTime,
      correct: this.correct,
      option: this.option,
      playerId: this.playerId,
      reward: this.reward,
      teamId: this.teamId,
      choiceIdx: this.choiceIdx,
    };
  }

  static validate(data: unknown): boolean {
    return GameQuestion.validate(data);
  }

  reset(): void {
    this.correct = null;
    this.option = null;
    this.playerId = null;
    this.reward = null;
    this.teamId = null;
    this.choiceIdx = null;
  }
}

export const NAGUI_OPTION_TO_SOUND: Record<string, string> = {
  hide: 'quest_ce_que_laudace',
  square: 'cest_carre',
  duo: 'cest_lheure_du_duo',
};
