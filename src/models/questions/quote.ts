import { DEFAULT_LOCALE, type Locale } from '@/helpers/locales';
import { isObjectEmpty } from '@/helpers/objects';
import { prependWithEmojiAndSpace } from '@/helpers/strings';
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

  // Everything in `toGuess` is masked here (nothing revealed yet). `PlayableQuestionService`
  // re-runs `redactQuoteDetails` with the live `revealed` state so uncovered elements /
  // quote parts come back in the clear as the game progresses.
  toPlayableObject(): Record<string, unknown> {
    const obj = this.toObject();
    return {
      ...obj,
      details: redactQuoteDetails(
        obj.details as QuoteDetails,
        () => false,
        () => false
      ),
    };
  }

  static validate(data: unknown): boolean {
    return BaseQuestion.validate(data);
  }

  setImage(_imageUrl: string): void {}
  setAudio(_audioUrl: string): void {}
}

/** Placeholder the client shows for an unrevealed `author` / `source` (its own JSX hardcodes
 *  `???`; this only needs to be truthy so the element still renders). */
export const QUOTE_HIDDEN_ELEMENT = '???';

export interface QuoteDetails {
  author?: string;
  quote?: string;
  quoteParts?: QuotePart[];
  source?: string;
  toGuess?: string[];
}

/**
 * A copy of a quote's `details` safe to hand a viewer who still has to guess the
 * `toGuess` elements. `isRevealed(element)` and `isQuotePartRevealed(sortedIdx)` decide
 * what stays in the clear; the rest is masked exactly the way the client's
 * `DisplayedQuote` / `DisplayedQuoteElement` would render it — a fixed `???` for
 * author/source, a length-preserving `_` run for each quote-part range.
 */
export function redactQuoteDetails(
  details: QuoteDetails,
  isRevealed: (element: string) => boolean,
  isQuotePartRevealed: (sortedIdx: number) => boolean
): QuoteDetails {
  const toGuess = details.toGuess ?? [];
  const quoteParts = details.quoteParts ?? [];
  const out: QuoteDetails = { ...details };

  if (toGuess.includes('author') && !isRevealed('author')) out.author = QUOTE_HIDDEN_ELEMENT;
  if (toGuess.includes('source') && !isRevealed('source')) out.source = QUOTE_HIDDEN_ELEMENT;
  if (toGuess.includes('quote') && quoteParts.length > 0) {
    out.quote = maskQuoteParts(details.quote ?? '', quoteParts, isQuotePartRevealed);
  }
  return out;
}

/** Replace every non-whitespace char inside each still-hidden quote-part range with `_`.
 *  Parts are walked in `startIdx` order to match the client's `DisplayedQuote`. */
function maskQuoteParts(
  quote: string,
  quoteParts: QuotePart[],
  isQuotePartRevealed: (sortedIdx: number) => boolean
): string {
  const sorted = [...quoteParts].sort((a, b) => a.startIdx - b.startIdx);
  let result = '';
  let lastIndex = 0;
  sorted.forEach((part, idx) => {
    result += quote.substring(lastIndex, part.startIdx);
    const within = quote.substring(part.startIdx, part.endIdx + 1);
    result += isQuotePartRevealed(idx) ? within : within.replace(/\S/g, '_');
    lastIndex = part.endIdx + 1;
  });
  result += quote.substring(lastIndex);
  return result;
}

export interface GameQuoteQuestionData extends GameBuzzerQuestionData {
  thinkingTime?: number;
  revealed?: Record<string, Record<string, unknown>>;
  toGuess?: string[];
  quoteParts?: QuotePart[];
  details?: { toGuess?: string[]; quoteParts?: QuotePart[]; revealed?: Record<string, Record<string, unknown>> };
}

export class GameQuoteQuestion extends GameBuzzerQuestion {
  static REWARDS_PER_ELEMENT = 1;
  static MAX_TRIES = 2;
  static THINKING_TIME = 15;

  thinkingTime: number;
  revealed: Record<string, Record<string, unknown>>;

  constructor(data: GameQuoteQuestionData) {
    super(data);
    this.thinkingTime = data.thinkingTime ?? GameQuoteQuestion.THINKING_TIME;
    this.revealed = (data.revealed ??
      (data.details as { revealed?: Record<string, Record<string, unknown>> } | undefined)?.revealed) as Record<
      string,
      Record<string, unknown>
    >;
    if (!this.revealed) {
      this.revealed = this.initializeRevealed(data);
    }
  }

  private initializeRevealed(data: GameQuoteQuestionData): Record<string, Record<string, unknown>> {
    const src = data.details ?? data;
    const toGuess: string[] = (src as { toGuess?: string[] }).toGuess ?? [];
    const quoteParts: string[] = (src as { quoteParts?: string[] }).quoteParts ?? [];
    const initial: Record<string, Record<string, unknown>> = toGuess.reduce(
      (acc: Record<string, Record<string, unknown>>, elem) => {
        acc[elem] = {};
        return acc;
      },
      {}
    );
    if (toGuess.includes(QuotePartElement.TYPE)) {
      initial[QuotePartElement.TYPE] = quoteParts.reduce((acc: Record<string, Record<string, unknown>>, _, idx) => {
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
    const revealedObj = this.revealed[quoteElem];
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
