import { BaseQuestion, GameQuestion } from '@/backend/models/questions/Question';
import { isArray } from '@/backend/utils/arrays';
import { QuestionType } from '@/backend/models/questions/QuestionType';
// Odd One Out questions
export class OddOneOutQuestion extends BaseQuestion {
  static TITLE_MAX_LENGTH = 75;
  static NOTE_MAX_LENGTH = 500;

  static MIN_NUM_ITEMS = 5;
  static MAX_NUM_ITEMS = 10;
  static ITEM_TITLE_MAX_LENGTH = 100;
  static ITEM_EXPLANATION_MAX_LENGTH = 150;

  constructor(data) {
    super(data);
    this.constructor.validate(data);

    this.items = data.items || data.details.items;
    this.answerIdx = data.answerIdx || data.details.answerIdx;
    this.title = data.title || data.details.title;
    this.note = data.note || data.details.note;
  }

  getQuestionType() {
    return QuestionType.ODD_ONE_OUT;
  }

  toObject() {
    return {
      ...super.toObject(),
      details: {
        items: this.items,
        answerIdx: this.answerIdx,
        title: this.title,
        note: this.note,
      },
    };
  }

  static validate(data) {
    super.validate(data);

    this.validateItems(data);
    this.validateAnswerIdx(data);
    this.validateTitle(data);
    this.validateNote(data);

    return true;
  }

  static validateAnswerIdx(data) {
    const answerIdx = data.answerIdx || data.details.answerIdx;
    const items = data.items || data.details.items;
    if (answerIdx === undefined) {
      throw new Error('Odd One Out must have a correct answer');
    }
    if (typeof answerIdx !== 'number') {
      throw new Error('Odd One Out must have a correct answer');
    }
    if (answerIdx < 0 || answerIdx >= items.length) {
      throw new Error('Odd One Out must have a correct answer');
    }

    return true;
  }

  static validateItems(data) {
    const items = data.items || data.details.items;
    if (!items) {
      throw new Error('Odd One Out must have items');
    }
    if (!isArray(items)) {
      throw new Error('Odd One Out items must be an array');
    }
    if (items.length < this.constructor.MIN_NUM_ITEMS) {
      throw new Error('Odd One Out must have at least 5 items');
    }
    if (items.length > this.constructor.MAX_NUM_ITEMS) {
      throw new Error('Odd One Out must have at most 10 items');
    }
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (typeof item !== 'object') {
        throw new Error('Odd One Out items must be an array of objects');
      }
      if (typeof item.title !== 'string') {
        throw new Error('Odd One Out items must be an array of objects with a title');
      }
      if (item.title.length > this.constructor.ITEM_TITLE_MAX_LENGTH) {
        throw new Error('Odd One Out item title must be at most 100 characters');
      }
      if (typeof item.explanation !== 'string') {
        throw new Error('Odd One Out item explanation must be a string');
      }
      if (item.explanation.length > this.constructor.ITEM_EXPLANATION_MAX_LENGTH) {
        throw new Error('Odd One Out item explanation must be at most 150 characters');
      }
    }

    return true;
  }

  static validateTitle(data) {
    const title = data.title || data.details.title;
    if (!title) {
      throw new Error('Odd One Out must have a title');
    }
    if (typeof title !== 'string') {
      throw new Error('Odd One Out must have a title');
    }
    if (title.length > this.constructor.TITLE_MAX_LENGTH) {
      throw new Error('Odd One Out must have a title');
    }

    return true;
  }

  static validateNote(data) {
    const note = data.note || data.details.note;
    if (note) {
      if (typeof note !== 'string') {
        throw new Error('Odd One Out must have a note');
      }
      if (note.length > this.constructor.NOTE_MAX_LENGTH) {
        throw new Error('Odd One Out must have a note');
      }
    }

    return true;
  }

  isValidAnswer(idx) {
    return idx === this.answerIdx;
  }
}

export class GameOddOneOutQuestion extends GameQuestion {
  static DEFAULT_MISTAKE_PENALTY = 1;
  static THINKING_TIME = 30;

  constructor(data) {
    super(data);
    this.constructor.validate(data);

    this.selectedItems = data.selectedItems || [];
  }

  toObject() {
    return {
      ...super.toObject(),
      selectedItems: this.selectedItems,
    };
  }

  validateSelectedItems() {
    if (!isArray(this.selectedItems)) {
      throw new Error('Odd One Out must have selected items');
    }

    return true;
  }

  reset() {
    super.reset();
    this.selectedItems = [];
  }
}
