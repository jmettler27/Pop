import { QuestionType, isValidQuestionType } from '@/backend/models/questions/QuestionType';
import { isValidTopic } from '@/backend/models/Topic';

export class Question {
  constructor(data) {
    //this.constructor.validate(data);

    this.id = data.id;
    this.type = data.type || this.getQuestionType();
  }

  toObject() {
    return {
      type: this.type,
    };
  }

  getQuestionType() {
    throw new Error('getQuestionType is not implemented');
  }

  static validate(data) {
    if (!data) {
      throw new Error('Question data is required');
    }

    this.validateId(data);
    // this.validateType(data);

    return true;
  }

  static validateId(data) {
    const id = data.id;
    if (id) {
      if (typeof id !== 'string') {
        throw new Error('Question ID must be a string');
      }
    }
    return true;
  }

  static validateType(data) {
    const type = data.type;

    if (!type) {
      throw new Error('Question type is required');
    }
    if (typeof type !== 'string') {
      throw new Error('Question type must be a string');
    }
    if (!isValidQuestionType(type)) {
      throw new Error(`Invalid question type: ${type}`);
    }
    return true;
  }
}

export class BaseQuestion extends Question {
  constructor(data) {
    super(data);
    this.constructor.validate(data);

    this.topic = data.topic;
    this.approved = data.approved;
    this.createdAt = data.createdAt || null;
    this.createdBy = data.createdBy;
    this.lang = data.lang;
  }

  toObject() {
    return {
      ...super.toObject(),
      topic: this.topic,
      approved: this.approved,
      createdAt: this.createdAt,
      createdBy: this.createdBy,
      lang: this.lang,
    };
  }

  static validate(data) {
    super.validate(data);

    this.validateTopic(data);
    this.validateApproved(data);
    //this.validateCreatedAt(data);
    this.validateCreatedBy(data);
    this.validateLang(data);

    return true;
  }

  static validateTopic(data) {
    const topic = data.topic;
    if (!topic) {
      throw new Error('Question topic is required');
    }
    if (typeof topic !== 'string') {
      throw new Error('Question topic must be a string');
    }
    if (!isValidTopic(topic)) {
      throw new Error(`Invalid question topic: ${topic}`);
    }
    return true;
  }

  static validateApproved(data) {
    const approved = data.approved;
    if (approved === undefined) {
      throw new Error('Question approved is required');
    }
    if (typeof approved !== 'boolean') {
      throw new Error('Question approved must be a boolean');
    }
    return true;
  }

  static validateCreatedAt(data) {
    const createdAt = data.createdAt;
    console.log('createdAt:', createdAt);
    console.log('typeof createdAt:', typeof createdAt);
    if (createdAt === undefined) {
      throw new Error('Question createdAt is required');
    }

    // Check if it's a timestamp object
    if (createdAt.seconds !== undefined && createdAt.nanoseconds !== undefined) {
      return true;
    }

    throw new Error('Question createdAt must be a timestamp');
  }

  static validateCreatedBy(data) {
    const createdBy = data.createdBy;
    if (createdBy === undefined) {
      throw new Error('Question createdBy is required');
    }
    if (typeof createdBy !== 'string') {
      throw new Error('Question createdBy must be a string');
    }
    return true;
  }

  static validateLang(data) {
    const lang = data.lang;
    if (lang === undefined) {
      throw new Error('Question lang is required');
    }
    if (typeof lang !== 'string') {
      throw new Error('Question lang must be a string');
    }
    return true;
  }

  setImage(imageUrl) {
    throw new Error('setImage is not implemented');
  }

  setAudio(audioUrl) {
    throw new Error('setAudio is not implemented');
  }
}

export class GameQuestion extends Question {
  constructor(data) {
    super(data);

    this.dateEnd = data.dateEnd;
    this.dateStart = data.dateStart;

    this.managedBy = data.managedBy;

    //this.gameId = data.gameId;
    //this.roundId = data.roundId;
    //this.thinkingTime = data.thinkingTime || 30;
  }

  getQuestionType() {
    throw new Error('getQuestionType is not implemented');
  }

  toObject() {
    return {
      ...super.toObject(),
      dateEnd: this.dateEnd || null,
      dateStart: this.dateStart || null,
      managedBy: this.managedBy,
    };
  }

  static validate(data) {
    super.validate(data);

    //this.validateDateEnd(data);
    //  this.validateDateStart(data);
    // this.validateManager(data);
    return true;
  }

  static validateDateEnd(data) {
    const dateEnd = data.dateEnd;
    if (dateEnd === undefined) {
      throw new Error('Question dateEnd is required');
    }
    if (typeof dateEnd !== 'string') {
      throw new Error('Question dateEnd must be a string');
    }
    return true;
  }

  static validateDateStart(data) {
    const dateStart = data.dateStart;
    if (dateStart === undefined) {
      throw new Error('Question dateStart is required');
    }
  }

  static validateManager(data) {
    const managedBy = data.managedBy;
    if (!managedBy) {
      throw new Error('Managed by is required');
    }
    if (typeof managedBy !== 'string') {
      throw new Error('Managed by must be a string');
    }
    return true;
  }

  validateManager() {
    if (!this.managedBy) {
      throw new Error('Managed by is required');
    }
    if (typeof this.managedBy !== 'string') {
      throw new Error('Managed by must be a string');
    }
  }

  reset() {
    throw new Error('Reset is not implemented');
  }
}
