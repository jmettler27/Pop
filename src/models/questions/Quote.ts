import { isObjectEmpty } from '@/backend/utils/objects';
import { DEFAULT_LOCALE, type Locale } from '@/frontend/helpers/locales';
import { prependWithEmojiAndSpace } from '@/frontend/helpers/strings';
import { GameBuzzerQuestion, type GameBuzzerQuestionData } from '@/models/questions/buzzer';
import { BaseQuestion, type BaseQuestionData } from '@/models/questions/question';
import { QuestionType } from '@/models/questions/question-type';

export interface QuotePart {
  startIdx: number;
  endIdx: number;
}

export const QUOTE_ELEMENT_TO_TITLE: Record<Locale, { source: string; author: string; quote: string }> = {
  en: { source: 'Source', author: 'Author', quote: 'Quote part' },
  fr: { source: 'Source', author: 'Auteur', quote: 'Partie de la réplique' },
};

export class QuoteSourceElement {
  static TYPE = 'source';
  static TYPE_TO_TITLE: Record<Locale, string> = { en: 'Source', fr: 'Source' };
  static TYPE_TO_EMOJI = '📜';
  static elementToEmoji(): string {
    return this.TYPE_TO_EMOJI;
  }
  static elementToTitle(lang: Locale = DEFAULT_LOCALE): string {
    return this.TYPE_TO_TITLE[lang];
  }
  static prependElementWithEmoji(lang: Locale = DEFAULT_LOCALE): string {
    return prependWithEmojiAndSpace(this.elementToEmoji(), this.elementToTitle(lang));
  }
}

export class QuoteAuthorElement {
  static TYPE = 'author';
  static TYPE_TO_TITLE: Record<Locale, string> = { en: 'Author', fr: 'Auteur' };
  static TYPE_TO_EMOJI = '🧑';
  static elementToEmoji(): string {
    return this.TYPE_TO_EMOJI;
  }
  static elementToTitle(lang: Locale = DEFAULT_LOCALE): string {
    return this.TYPE_TO_TITLE[lang];
  }
  static prependElementWithEmoji(lang: Locale = DEFAULT_LOCALE): string {
    return prependWithEmojiAndSpace(this.elementToEmoji(), this.elementToTitle(lang));
  }
}

export class QuotePartElement {
  static TYPE = 'quote';
  static TYPE_TO_TITLE: Record<Locale, string> = { en: 'Quote part', fr: 'Partie de la réplique' };
  static TYPE_TO_EMOJI = '💬';
  static elementToEmoji(): string {
    return this.TYPE_TO_EMOJI;
  }
  static elementToTitle(lang: Locale = DEFAULT_LOCALE): string {
    return this.TYPE_TO_TITLE[lang];
  }
  static prependElementWithEmoji(lang: Locale = DEFAULT_LOCALE): string {
    return prependWithEmojiAndSpace(this.elementToEmoji(), this.elementToTitle(lang));
  }
}

export interface QuoteQuestionData extends BaseQuestionData {
  author?: string;
  quote?: string;
  quoteParts?: QuotePart[];
  source?: string;
  toGuess?: string[];
  details?: { author?: string; quote?: string; quoteParts?: QuotePart[]; source?: string; toGuess?: string[] };
}

export class QuoteQuestion extends BaseQuestion {
  static QUOTE_MAX_LENGTH = 300;
  static SOURCE_MAX_LENGTH = 50;
  static AUTHOR_MAX_LENGTH = 50;
  static ELEMENTS = ['source', 'author', 'quote'];
  static ELEMENTS_SORT_ORDER = ['quote', 'author', 'source'];

  author: string | undefined;
  quote: string | undefined;
  quoteParts: QuotePart[] | undefined;
  source: string | undefined;
  toGuess: string[] | undefined;

  constructor(data: QuoteQuestionData) {
    super(data);
    const d = (data.details ?? {}) as QuoteQuestionData;
    this.author = data.author ?? d.author;
    this.quote = data.quote ?? d.quote;
    this.quoteParts = data.quoteParts ?? d.quoteParts;
    this.source = data.source ?? d.source;
    this.toGuess = data.toGuess ?? d.toGuess;
  }

  static elementToTitle(element: string, lang: Locale = DEFAULT_LOCALE): string {
    return QUOTE_ELEMENT_TO_TITLE[lang][element as keyof (typeof QUOTE_ELEMENT_TO_TITLE)[Locale]];
  }

  static elementToEmoji(element: string): string {
    switch (element) {
      case QuoteSourceElement.TYPE:
        return QuoteSourceElement.elementToEmoji();
      case QuoteAuthorElement.TYPE:
        return QuoteAuthorElement.elementToEmoji();
      case QuotePartElement.TYPE:
        return QuotePartElement.elementToEmoji();
      default:
        return '';
    }
  }

  static prependElementWithEmoji(element: string, lang: Locale = DEFAULT_LOCALE): string {
    switch (element) {
      case QuoteSourceElement.TYPE:
        return QuoteSourceElement.prependElementWithEmoji(lang);
      case QuoteAuthorElement.TYPE:
        return QuoteAuthorElement.prependElementWithEmoji(lang);
      case QuotePartElement.TYPE:
        return QuotePartElement.prependElementWithEmoji(lang);
      default:
        return '';
    }
  }

  getQuestionType(): QuestionType {
    return QuestionType.QUOTE;
  }

  toObject(): Record<string, unknown> {
    return {
      ...super.toObject(),
      details: {
        author: this.author,
        quote: this.quote,
        quoteParts: this.quoteParts,
        source: this.source,
        toGuess: this.toGuess,
      },
    };
  }

  static validate(data: unknown): boolean {
    return BaseQuestion.validate(data);
  }

  setImage(_imageUrl: string): void {}
  setAudio(_audioUrl: string): void {}
}

export interface GameQuoteQuestionData extends GameBuzzerQuestionData {
  thinkingTime?: number;
  revealed?: Record<string, unknown>;
  toGuess?: string[];
  quoteParts?: QuotePart[];
  details?: { toGuess?: string[]; quoteParts?: QuotePart[]; revealed?: Record<string, unknown> };
}

export class GameQuoteQuestion extends GameBuzzerQuestion {
  static REWARDS_PER_ELEMENT = 1;
  static MAX_TRIES = 2;
  static THINKING_TIME = 15;

  thinkingTime: number;
  revealed: Record<string, unknown>;

  constructor(data: GameQuoteQuestionData) {
    super(data);
    this.thinkingTime = data.thinkingTime ?? GameQuoteQuestion.THINKING_TIME;
    this.revealed = (data.revealed ??
      (data.details as { revealed?: Record<string, unknown> } | undefined)?.revealed) as Record<string, unknown>;
    if (!this.revealed) {
      this.revealed = this.initializeRevealed(data);
    }
  }

  private initializeRevealed(data: GameQuoteQuestionData): Record<string, unknown> {
    const src = data.details ?? data;
    const toGuess: string[] = (src as { toGuess?: string[] }).toGuess ?? [];
    const quoteParts: string[] = (src as { quoteParts?: string[] }).quoteParts ?? [];
    const initial: Record<string, unknown> = toGuess.reduce((acc: Record<string, unknown>, elem) => {
      acc[elem] = {};
      return acc;
    }, {});
    if (toGuess.includes(QuotePartElement.TYPE)) {
      initial[QuotePartElement.TYPE] = quoteParts.reduce((acc: Record<string, unknown>, _, idx) => {
        acc[idx] = {};
        return acc;
      }, {});
    }
    return initial;
  }

  getQuestionType(): QuestionType {
    return QuestionType.QUOTE;
  }

  toObject(): Record<string, unknown> {
    return { ...super.toObject(), thinkingTime: this.thinkingTime, revealed: this.revealed };
  }

  static validate(data: unknown): boolean {
    return GameBuzzerQuestion.validate(data);
  }

  reset(): void {
    this.revealed = {};
  }

  quoteElementIsRevealed(quoteElem: string): boolean {
    const revealedObj = this.revealed[quoteElem] as Record<string, unknown> | undefined;
    if (!revealedObj) return false;
    const notEmpty = !isObjectEmpty(revealedObj);
    if (quoteElem === 'quote') {
      return notEmpty && Object.values(revealedObj).every((obj) => !isObjectEmpty(obj as Record<string, unknown>));
    }
    return notEmpty;
  }

  atLeastOneElementRevealed(): boolean {
    return Object.keys(this.revealed).some((key) => this.quoteElementIsRevealed(key));
  }

  quotePartIsRevealed(quotePartIdx: number): boolean {
    const revealedObj = this.revealed['quote'] as Record<string, unknown> | undefined;
    return (
      !!revealedObj &&
      !isObjectEmpty(revealedObj) &&
      !isObjectEmpty((revealedObj[quotePartIdx] as Record<string, unknown>) ?? {})
    );
  }
}
