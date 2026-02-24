import { QuestionType } from '@/backend/models/questions/QuestionType';
import { BaseQuestion, GameQuestion } from '@/backend/models/questions/Question';

import { isArray } from '@/backend/utils/arrays';
import { isObjectEmpty } from '@/backend/utils/objects';
import { prependWithEmojiAndSpace } from '@/backend/utils/strings';
import { DEFAULT_LOCALE } from '@/frontend/utils/locales';

export const QUOTE_ELEMENT_TO_TITLE = {
  en: {
    source: 'Source',
    author: 'Author',
    quote: 'Quote part',
  },
  'fr-FR': {
    source: 'Source',
    author: 'Auteur',
    quote: 'Partie de la réplique',
  },
};

// Source quote element
export class QuoteSourceElement {
  static TYPE = 'source';

  static TYPE_TO_TITLE = {
    en: 'Source',
    'fr-FR': 'Source',
  };
  static TYPE_TO_EMOJI = '📜';

  static elementToEmoji() {
    return this.TYPE_TO_EMOJI;
  }

  static elementToTitle(lang = DEFAULT_LOCALE) {
    return this.TYPE_TO_TITLE[lang];
  }

  static prependElementWithEmoji(lang = DEFAULT_LOCALE) {
    return prependWithEmojiAndSpace(this.elementToEmoji(), this.elementToTitle(lang));
  }
}

// Author quote element
export class QuoteAuthorElement {
  static TYPE = 'author';

  static TYPE_TO_TITLE = {
    en: 'Author',
    'fr-FR': 'Auteur',
  };
  static TYPE_TO_EMOJI = '🧑';

  static elementToEmoji() {
    return this.TYPE_TO_EMOJI;
  }

  static elementToTitle(lang = DEFAULT_LOCALE) {
    return this.TYPE_TO_TITLE[lang];
  }

  static prependElementWithEmoji(lang = DEFAULT_LOCALE) {
    return prependWithEmojiAndSpace(this.elementToEmoji(), this.elementToTitle(lang));
  }
}

// Quote part element
export class QuotePartElement {
  static TYPE = 'quote';

  static TYPE_TO_TITLE = {
    en: 'Quote part',
    'fr-FR': 'Partie de la réplique',
  };

  static TYPE_TO_EMOJI = '💬';

  static elementToEmoji() {
    return this.TYPE_TO_EMOJI;
  }

  // static elementToTitle(lang = DEFAULT_LOCALE) {
  //   return this.TYPE_TO_TITLE[lang];
  // }

  static prependElementWithEmoji(lang = DEFAULT_LOCALE) {
    return prependWithEmojiAndSpace(this.elementToEmoji(), this.elementToTitle(lang));
  }
}

// Quote question
export class QuoteQuestion extends BaseQuestion {
  static QUOTE_MAX_LENGTH = 300;
  static SOURCE_MAX_LENGTH = 50;
  static AUTHOR_MAX_LENGTH = 50;
  static ELEMENTS = ['source', 'author', 'quote'];

  static ELEMENTS_SORT_ORDER = ['quote', 'author', 'source'];

  constructor(data) {
    super(data);
    this.constructor.validate(data);

    this.author = data.author || data.details.author;
    this.quote = data.quote || data.details.quote;
    this.quoteParts = data.quoteParts || data.details.quoteParts;
    this.source = data.source || data.details.source;
    this.toGuess = data.toGuess || data.details.toGuess;
  }

  static elementToTitle(element, lang = DEFAULT_LOCALE) {
    return QUOTE_ELEMENT_TO_TITLE[lang][element];
  }

  getQuestionType() {
    return QuestionType.QUOTE;
  }

  toObject() {
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

  static elementToEmoji(element) {
    if (element === QuoteSourceElement.TYPE) return QuoteSourceElement.elementToEmoji();
    if (element === QuoteAuthorElement.TYPE) return QuoteAuthorElement.elementToEmoji();
    if (element === QuotePartElement.TYPE) return QuotePartElement.elementToEmoji();
  }

  static validate(data) {
    super.validate(data);

    this.validateQuote(data);
    this.validateAuthor(data);
    this.validateSource(data);

    return true;
  }

  static validateQuote(data) {
    const quote = data.quote || data.details.quote;
    const toGuess = data.toGuess || data.details.toGuess;

    if (!quote) {
      throw new Error('Quote must have quote');
    }
    if (typeof quote !== 'string') {
      throw new Error('Quote must be a string');
    }
    if (quote.length > this.constructor.QUOTE_MAX_LENGTH) {
      throw new Error('Quote must be less than 300 characters');
    }
    if (!toGuess) {
      throw new Error('Quote must have elements to guess');
    }
    if (!isArray(toGuess)) {
      throw new Error('Quote elements to guess must be an array');
    }
    if (toGuess.length === 0) {
      throw new Error('Quote must have at least one element to guess');
    }
    if (toGuess.some((elem) => typeof elem !== 'string')) {
      throw new Error('Quote elements to guess must be an array of strings');
    }

    return true;
  }

  static validateAuthor(data) {
    const author = data.author || data.details.author;
    if (author) {
      if (typeof author !== 'string') {
        throw new Error('Quote author must be a string');
      }
      if (author.length > this.constructor.AUTHOR_MAX_LENGTH) {
        throw new Error('Quote author must be less than 50 characters');
      }
    }

    return true;
  }

  static validateSource(data) {
    const source = data.source || data.details.source;
    if (source) {
      if (typeof source !== 'string') {
        throw new Error('Quote source must be a string');
      }
      if (source.length > this.constructor.SOURCE_MAX_LENGTH) {
        throw new Error('Quote source must be less than 50 characters');
      }
    }

    return true;
  }

  getInitialRevealed() {
    return {
      quote: this.quoteParts.map(() => ({})),
      author: {},
      source: {},
    };
  }

  getAllElementsRevealed(playerId) {
    return {
      quote: this.quoteParts.map(() => ({ playerId, timestamp: new Date() })),
      author: { playerId, timestamp: new Date() },
      source: { playerId, timestamp: new Date() },
    };
  }

  isAllRevealed(revealed) {
    return (
      this.toGuess.every((elem) => revealed[elem] && Object.keys(revealed[elem]).length > 0) &&
      this.quoteParts.every((_, idx) => revealed.quote[idx] && Object.keys(revealed.quote[idx]).length > 0)
    );
  }
}

export class GameQuoteQuestion extends GameQuestion {
  static REWARDS_PER_ELEMENT = 1;
  static MAX_TRIES = 2;
  static THINKING_TIME = 30;

  constructor(data) {
    super(data);

    this.revealed = data.revealed || data.details.revealed;
    if (!this.revealed) {
      this.initializeRevealed(data);
    }

    this.constructor.validate(data);
  }

  initializeRevealed(data) {
    const { toGuess, quoteParts } = data.details || data;
    const initialRevealed = toGuess.reduce((acc, elem) => {
      acc[elem] = {};
      return acc;
    }, {});
    if (toGuess.includes(QuotePartElement.TYPE)) {
      initialRevealed[QuotePartElement.TYPE] = quoteParts.reduce((acc, _, idx) => {
        acc[idx] = {};
        return acc;
      }, {});
    }

    this.revealed = initialRevealed;
  }

  getQuestionType() {
    return QuestionType.QUOTE;
  }

  toObject() {
    return {
      ...super.toObject(),
      revealed: this.revealed,
    };
  }

  static validate(data) {
    super.validate(data);

    this.validateRevealed(data);

    return true;
  }

  static validateRevealed(data) {
    const revealed = data.revealed || data.details.revealed;
    if (revealed) {
      if (typeof revealed !== 'object') {
        throw new Error('Revealed must be an object');
      }
    }
    return true;
  }

  reset() {
    super.reset();
    this.revealed = {};
  }

  quoteElementIsRevealed(quoteElem) {
    const revealedObj = this.revealed[quoteElem];
    const revealedObjIsNotEmpty = !isObjectEmpty(revealedObj);

    if (quoteElem === 'quote') {
      return revealedObjIsNotEmpty && Object.values(revealedObj).every((obj) => !isObjectEmpty(obj));
    }
    return revealedObjIsNotEmpty;
  }

  atLeastOneElementRevealed() {
    return Object.keys(this.revealed).some((key) => this.quoteElementIsRevealed(key));
  }

  quotePartIsRevealed(quotePartIdx) {
    const revealedObj = this.revealed['quote'];
    return !isObjectEmpty(revealedObj) && !isObjectEmpty(revealedObj[quotePartIdx]);
  }
}
