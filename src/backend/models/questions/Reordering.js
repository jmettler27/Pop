import { BaseQuestion, GameQuestion } from '@/backend/models/questions/Question';
import { isArray } from '@/backend/utils/arrays';
import { QuestionType } from '@/backend/models/questions/QuestionType';

// Reordering questions
export class ReorderingQuestion extends BaseQuestion {
  static TITLE_MAX_LENGTH = 75;
  static NOTE_MAX_LENGTH = 500;

  static MIN_NUM_ITEMS = 3;
  static MAX_NUM_ITEMS = 20;
  static ITEM_TITLE_MAX_LENGTH = 75;
  static ITEM_EXPLANATION_MAX_LENGTH = 150;

  constructor(data) {
    super(data);
    this.constructor.validate(data);

    this.items = data.items || data.details.items;
    this.title = data.title || data.details.title;
    this.note = data.note || data.details.note;
  }

  getQuestionType() {
    return QuestionType.REORDERING;
  }

  toObject() {
    return {
      ...super.toObject(),
      details: {
        items: this.items,
        title: this.title,
        note: this.note,
      },
    };
  }

  static validate(data) {
    super.validate(data);

    this.validateItems(data);
    this.validateTitle(data);
    this.validateNote(data);

    return true;
  }

  static validateItems(data) {
    const items = data.items || data.details.items;

    if (!items) {
      throw new Error('Reordering question must have items');
    }
    if (!isArray(items)) {
      throw new Error('Reordering question items must be an array');
    }
    if (items.length < this.constructor.MIN_NUM_ITEMS) {
      throw new Error('Reordering question must have at least 3 items');
    }
    if (items.length > this.constructor.MAX_NUM_ITEMS) {
      throw new Error('Reordering question must have at most 20 items');
    }
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (typeof item !== 'object') {
        throw new Error('Reordering question items must be an array of objects');
      }
      if (typeof item.title !== 'string') {
        throw new Error('Reordering question item title must be a string');
      }
      if (item.title.length > this.constructor.ITEM_TITLE_MAX_LENGTH) {
        throw new Error('Reordering question item title must be at most 75 characters');
      }
    }
    return true;
  }

  static validateTitle(data) {
    const title = data.title || data.details.title;
    if (!title) {
      throw new Error('Reordering question must have a title');
    }
    if (typeof title !== 'string') {
      throw new Error('Reordering question title must be a string');
    }
    if (title.length > this.constructor.TITLE_MAX_LENGTH) {
      throw new Error('Reordering question title must be at most 75 characters');
    }
    return true;
  }

  static validateNote(data) {
    const note = data.note || data.details.note;
    if (note) {
      if (typeof note !== 'string') {
        throw new Error('Reordering question note must be a string');
      }
      if (note.length > this.constructor.NOTE_MAX_LENGTH) {
        throw new Error('Reordering question note must be at most 500 characters');
      }
    }
    return true;
  }
}

export class GameReorderingQuestion extends GameQuestion {
  static THINKING_TIME = 30;

  constructor(data) {
    super(data);

    this.orderings = data.orderings;
  }

  toObject() {
    return {
      ...super.toObject(),
      orderings: this.orderings,
    };
  }

  getQuestionType() {
    return QuestionType.REORDERING;
  }

  reset() {
    super.reset();
    this.orderings = {};
  }
}
