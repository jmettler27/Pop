import { BaseQuestion, GameQuestion } from '@/backend/models/questions/Question';
import { isArray } from '@/backend/utils/arrays';
import { DEFAULT_LOCALE } from '@/frontend/utils/locales';
import { QuestionType } from '@/backend/models/questions/QuestionType';
import { prependWithEmojiAndSpace } from '@/backend/utils/strings';

export class NaguiOption {
  static TYPE_TO_TITLE = {
    en: '',
    'fr-FR': '',
  };

  static TYPE_TO_EMOJI = '';

  static typeToEmoji() {
    return this.TYPE_TO_EMOJI;
  }

  static typeToTitle(lang = DEFAULT_LOCALE) {
    return this.TYPE_TO_TITLE[lang];
  }

  static prependTypeWithEmoji(lang = DEFAULT_LOCALE) {
    return prependWithEmojiAndSpace(this.typeToEmoji(lang), this.typeToTitle(lang));
  }
}

export class HideNaguiOption extends NaguiOption {
  static TYPE = 'hide';
  static TYPE_TO_TITLE = {
    en: 'Hide',
    'fr-FR': 'Cache',
  };
  static TYPE_TO_EMOJI = '🙈';
}

export class SquareNaguiOption extends NaguiOption {
  static TYPE = 'square';
  static TYPE_TO_TITLE = {
    en: 'Square',
    'fr-FR': 'Carré',
  };
  static TYPE_TO_EMOJI = '4️⃣';
}

export class DuoNaguiOption extends NaguiOption {
  static TYPE = 'duo';
  static TYPE_TO_TITLE = {
    en: 'Duo',
    'fr-FR': 'Duo',
  };
  static TYPE_TO_EMOJI = '2️⃣';
}

// Nagui questions
export class NaguiQuestion extends BaseQuestion {
  static CHOICES = ['A', 'B', 'C', 'D'];
  static MIN_CHOICES = 2;
  static MAX_CHOICES = NaguiQuestion.CHOICES.length;
  static CHOICE_MAX_LENGTH = 100;

  static TITLE_MAX_LENGTH = 125;
  static NOTE_MAX_LENGTH = 500;
  static EXPLANATION_MAX_LENGTH = 500;
  static SOURCE_MAX_LENGTH = 50;

  static OPTIONS = {
    hide: HideNaguiOption,
    square: SquareNaguiOption,
    duo: DuoNaguiOption,
  };

  constructor(data) {
    super(data);
    this.constructor.validate(data);

    this.choices = data.choices || data.details.choices;
    this.answerIdx = data.answerIdx || data.details.answerIdx;
    this.duoIdx = data.duoIdx || data.details.duoIdx;

    this.source = data.source || data.details.source;
    this.title = data.title || data.details.title;
    this.note = data.note || data.details.note;
    this.explanation = data.explanation || data.details.explanation;
  }

  getQuestionType() {
    return QuestionType.NAGUI;
  }

  toObject() {
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

  setImage(imageUrl) {
    this.image = imageUrl;
  }

  setAudio(audioUrl) {
    this.audio = audioUrl;
  }

  static validate(data) {
    super.validate(data);

    this.validateChoices(data);
    this.validateAnswerIdx(data);
    this.validateDuoIdx(data);
    this.validateExplanation(data);
    this.validateNote(data);
    this.validateSource(data);
    this.validateTitle(data);

    return true;
  }

  static validateChoices(data) {
    const choices = data.choices || data.details.choices;
    if (!choices) {
      throw new Error('Nagui must have choices');
    }
    if (!isArray(choices)) {
      throw new Error('Nagui choices must be an array');
    }
    if (choices.length < this.constructor.MIN_CHOICES) {
      throw new Error('Nagui must have at least 2 choices');
    }
    if (choices.length > this.constructor.MAX_CHOICES) {
      throw new Error('Nagui must have at most 4 choices');
    }
    for (let i = 0; i < choices.length; i++) {
      const choice = choices[i];
      if (typeof choice !== 'string') {
        throw new Error('Nagui choices must be an array of strings');
      }
      if (choice.length > this.constructor.CHOICE_MAX_LENGTH) {
        throw new Error('Nagui choice must be at most 100 characters');
      }
    }
  }

  static validateAnswerIdx(data) {
    const answerIdx = data.answerIdx || data.details.answerIdx;
    const choices = data.choices || data.details.choices;
    if (typeof answerIdx !== 'number') {
      throw new Error('Nagui answer index must be a number');
    }
    if (answerIdx < 0 || answerIdx >= choices.length) {
      throw new Error('Nagui answer index must be between 0 and 3');
    }

    return true;
  }

  static validateTitle(data) {
    const title = data.title || data.details.title;
    if (!title) {
      throw new Error('Nagui must have a title');
    }
    if (typeof title !== 'string') {
      throw new Error('Nagui title must be a string');
    }
    if (title.length > this.constructor.TITLE_MAX_LENGTH) {
      throw new Error('Nagui title must be at most 125 characters');
    }

    return true;
  }

  static validateNote(data) {
    const note = data.note || data.details.note;
    if (note && typeof note !== 'string') {
      throw new Error('Nagui note must be a string');
    }
    if (note && note.length > this.constructor.NOTE_MAX_LENGTH) {
      throw new Error('Nagui note must be at most 500 characters');
    }

    return true;
  }

  static validateExplanation(data) {
    const explanation = data.explanation || data.details.explanation;
    if (explanation && typeof explanation !== 'string') {
      throw new Error('Nagui explanation must be a string');
    }
    if (explanation && explanation.length > this.constructor.EXPLANATION_MAX_LENGTH) {
      throw new Error('Nagui explanation must be at most 500 characters');
    }

    return true;
  }

  static validateSource(data) {
    const source = data.source || data.details.source;
    if (source && typeof source !== 'string') {
      throw new Error('Nagui source must be a string');
    }
    if (source && source.length > this.constructor.SOURCE_MAX_LENGTH) {
      throw new Error('Nagui source must be at most 50 characters');
    }

    return true;
  }

  static validateDuoIdx(data) {
    const choices = data.choices || data.details.choices;
    const duoIdx = data.duoIdx || data.details.duoIdx;
    if (typeof duoIdx !== 'number') {
      throw new Error('Nagui duo index must be a number');
    }
    if (duoIdx < 0 || duoIdx >= choices.length) {
      throw new Error('Nagui duo index must be between 0 and 3');
    }

    return true;
  }

  isValidAnswer(idx) {
    return idx === this.answerIdx;
  }

  static typeToEmoji(type) {
    return this.OPTIONS[type].TYPE_TO_EMOJI;
  }

  static typeToTitle(type, lang = DEFAULT_LOCALE) {
    return this.OPTIONS[type].TYPE_TO_TITLE[lang];
  }

  static prependTypeWithEmoji(type, lang = DEFAULT_LOCALE) {
    return `${this.OPTIONS[type].TYPE_TO_EMOJI} ${this.OPTIONS[type].TYPE_TO_TITLE[lang]}`;
  }
}

export class GameNaguiQuestion extends GameQuestion {
  static REWARDS = {
    hide: 5,
    square: 3,
    duo: 2,
  };

  static NAGUI_OPTIONS = ['hide', 'square', 'duo'];

  static THINKING_TIME = 20;

  constructor(data) {
    super(data);
    // this.constructor.validate(data);

    this.correct = data.correct || null;
    this.option = data.option || null;
    this.playerId = data.playerId || null;
    this.reward = data.reward || null;
    this.teamId = data.teamId || null;
  }

  toObject() {
    return {
      ...super.toObject(),
      correct: this.correct,
      option: this.option,
      playerId: this.playerId,
      reward: this.reward,
      teamId: this.teamId,
    };
  }

  getQuestionType() {
    return QuestionType.NAGUI;
  }

  static validate(data) {
    super.validate(data);

    this.validateCorrect(data);
    this.validateOption(data);
    this.validatePlayerID(data);
    this.validateReward(data);
    this.validateTeamId(data);

    return true;
  }

  static validateCorrect(data) {
    const correct = data.correct;
    if (correct) {
      if (typeof correct !== 'boolean') {
        throw new Error('Nagui correct must be a boolean');
      }
    }
    return true;
  }

  static validateOption(data) {
    const option = data.option;
    if (option) {
      if (typeof option !== 'string') {
        throw new Error('Nagui option must be a string');
      }
      if (option.length > this.constructor.CHOICE_MAX_LENGTH) {
        throw new Error('Nagui option must be at most 100 characters');
      }
    }
    return true;
  }

  static validatePlayerID(data) {
    const playerId = data.playerId;
    if (playerId) {
      if (typeof playerId !== 'string') {
        throw new Error('Nagui playerId must be a string');
      }
    }
    return true;
  }

  static validateReward(data) {
    const reward = data.reward;
    if (reward) {
      if (typeof reward !== 'number') {
        throw new Error('Nagui reward must be a number');
      }
    }
    return true;
  }

  static validateOption(data) {
    const option = data.option;
    if (option) {
      if (typeof option !== 'string') {
        throw new Error('Nagui option must be a string');
      }
      if (option.length > this.constructor.CHOICE_MAX_LENGTH) {
        throw new Error('Nagui option must be at most 100 characters');
      }
    }
    return true;
  }

  static validateTeamId(data) {
    const teamId = data.teamId;
    if (teamId) {
      if (typeof teamId !== 'string') {
        throw new Error('Nagui teamId must be a string');
      }
    }
    return true;
  }

  reset() {
    super.reset();
    this.correct = null;
    this.option = null;
    this.playerId = null;
    this.reward = null;
    this.teamId = null;
  }
}

export const NAGUI_OPTION_TO_SOUND = {
  hide: 'quest_ce_que_laudace',
  square: 'cest_carre',
  duo: 'cest_lheure_du_duo',
};
