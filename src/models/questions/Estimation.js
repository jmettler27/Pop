import { BaseQuestion, GameQuestion } from '@/models/questions/Question';
import { QuestionType } from '@/models/questions/QuestionType';

// Estimation questions
export class EstimationQuestion extends BaseQuestion {
  static AnswerType = Object.freeze({
    INTEGER: 'integer',
    DECIMAL: 'decimal',
    YEAR: 'year',
    DATE: 'date',
  });

  static BetType = Object.freeze({
    EXACT: 'exact',
    RANGE: 'range',
  });

  // Per-type validation bounds
  static INTEGER_MIN = -999_999_999;
  static INTEGER_MAX = 999_999_999;
  static DECIMAL_MIN = -999_999_999.999_999;
  static DECIMAL_MAX = 999_999_999.999_999;
  static YEAR_MIN = 1;
  static YEAR_MAX = 9999;
  static DATE_MIN = '0001-01-01'; // ISO 8601
  static DATE_MAX = '9999-12-31'; // ISO 8601

  static EXPLANATION_MAX_LENGTH = 200;
  static NOTE_MAX_LENGTH = 500;
  static SOURCE_MAX_LENGTH = 75;
  static TITLE_MAX_LENGTH = 75;

  /**
   * Parse a stored answer string to its native JS type for scoring / display.
   * Returns null if the value is empty or cannot be parsed.
   */
  static parseAnswer(answerType, answerStr) {
    if (!answerStr) return null;
    switch (answerType) {
      case EstimationQuestion.AnswerType.INTEGER:
      case EstimationQuestion.AnswerType.YEAR: {
        const n = parseInt(answerStr, 10);
        return isNaN(n) ? null : n;
      }
      case EstimationQuestion.AnswerType.DECIMAL: {
        const n = parseFloat(answerStr);
        return isNaN(n) ? null : n;
      }
      case EstimationQuestion.AnswerType.DATE:
        return answerStr; // kept as ISO string; callers do `new Date(answer)` as needed
      default:
        return null;
    }
  }

  constructor(data) {
    super(data);

    const details = data.details || {};
    this.answerType = data.answerType ?? details.answerType ?? EstimationQuestion.AnswerType.INTEGER;
    this.answer = data.answer ?? details.answer ?? '';
    this.explanation = data.explanation ?? details.explanation ?? '';
    this.note = data.note ?? details.note ?? '';
    this.source = data.source ?? details.source ?? '';
    this.title = data.title ?? details.title ?? '';
  }

  getQuestionType() {
    return QuestionType.ESTIMATION;
  }

  toObject() {
    return {
      ...super.toObject(),
      details: {
        answerType: this.answerType,
        answer: this.answer,
        explanation: this.explanation,
        note: this.note,
        source: this.source,
        title: this.title,
      },
    };
  }
}

export class GameEstimationQuestion extends GameQuestion {
  static REWARD = 1;
  static THINKING_TIME = 90;

  constructor(data) {
    super(data);

    this.bets = data.bets || [];
    this.reward = data.reward || GameEstimationQuestion.REWARD;
    this.thinkingTime = data.thinkingTime || GameEstimationQuestion.THINKING_TIME;
    this.winners = data.winners || [];

    // this.constructor.validate(data);
  }

  toObject() {
    return {
      ...super.toObject(),
      bets: this.bets,
      reward: this.reward,
      thinkingTime: this.thinkingTime,
      winners: this.winners,
    };
  }

  getQuestionType() {
    return QuestionType.ESTIMATION;
  }

  reset() {
    super.reset();
    this.bets = [];
    this.winners = [];
  }
}
