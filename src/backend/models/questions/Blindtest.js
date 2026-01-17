import { BuzzerQuestion, GameBuzzerQuestion } from '@/backend/models/questions/Buzzer';
import { QuestionType } from '@/backend/models/questions/QuestionType';
import { DEFAULT_LOCALE } from '@/frontend/utils/locales';

// Blindtest type enum with translations
export class BlindtestType {
    static SONG = 'song';
    static SOUND = 'sound';

    static TRANSLATIONS = {
        [BlindtestType.SONG]: {
            'en': 'Music',
            'fr-FR': 'Musique',
            emoji: '🎵'
        },
        [BlindtestType.SOUND]: {
            'en': 'Sound',
            'fr-FR': 'Son',
            emoji: '🔊'
        }
    };

    static getEmoji(type) {
        return this.TRANSLATIONS[type]?.emoji || '';
    }

    static getTitle(type, lang = DEFAULT_LOCALE) {
        return this.TRANSLATIONS[type]?.[lang] || '';
    }

    static getAllTypes() {
        return Object.keys(this.TRANSLATIONS);
    }

    static isValid(type) {
        return type in this.TRANSLATIONS;
    }
}

// Blindtest question class
export class BlindtestQuestion extends BuzzerQuestion {
    static TITLE_MAX_LENGTH = 50;
    static ANSWER_TITLE_MAX_LENGTH = 50;
    static ANSWER_SOURCE_MAX_LENGTH = 75;
    static ANSWER_AUTHOR_MAX_LENGTH = 50;

    static ELEMENTS = ['title', 'source', 'author'];

    constructor(data) {
        super(data);

        console.log("Data", data);

        this.answer = data.answer || (data.details?.answer || {});
        this.audio = data.audio || data.details?.audio;
        this.subtype = data.subtype || data.details?.subtype;
        this.title = data.title || data.details?.title;

        this.constructor.validate(data);
    }

    getQuestionType() {
        return QuestionType.BLINDTEST;
    }

    toObject() {
        return {
            ...super.toObject(),
            answer: this.answer,
            audio: this.audio || null,
            subtype: this.subtype,
            title: this.title
        };
    }

    setImage(imageUrl) {
        this.answer.image = imageUrl;
    }

    setAudio(audioUrl) {
        this.audio = audioUrl;
    }
    
    static validate(data) {
        super.validate(data);

        this.validateAnswer(data);
        //this.validateAudio(data);
        this.validateSubtype(data);
        this.validateTitle(data);

        return true;
    }

    static validateAnswer(data) {
        const answer = data.answer || data.details.answer;
        if (!answer) {
            throw new Error("Answer is required");
        }
        if (typeof answer !== 'object') {
            throw new Error("Answer must be an object");
        }

        if (answer.author) {
            if (typeof answer.author !== 'string') {
                throw new Error("Answer author must be a string");
            }
            if (answer.author.length > this.constructor.ANSWER_AUTHOR_MAX_LENGTH) {
                throw new Error(`Answer author must be at most ${this.constructor.ANSWER_AUTHOR_MAX_LENGTH} characters`);
            }
        }

        if (answer.image) {
            if (typeof answer.image !== 'string') {
                throw new Error("Answer image must be a string");
            }
        }

        if (answer.source) {
            if (typeof answer.source !== 'string') {
                throw new Error("Answer source must be a string");
            }
            if (answer.source.length > this.constructor.ANSWER_SOURCE_MAX_LENGTH) {
                throw new Error(`Answer source must be at most ${this.constructor.ANSWER_SOURCE_MAX_LENGTH} characters`);
            }
        }

        if (!answer.title) {
            throw new Error("Answer must have a title");
        }
        if (typeof answer.title !== 'string') {
            throw new Error("Answer title must be a string");
        }
        if (answer.title.length > this.constructor.ANSWER_TITLE_MAX_LENGTH) {
            throw new Error(`Answer title must be at most ${this.constructor.ANSWER_TITLE_MAX_LENGTH} characters`);
        }

        return true;
    }

    static validateAudio(data) {
        const audio = data.audio || data.details.audio;
        if (audio) {
            if (typeof audio !== 'string') {
                throw new Error("Audio must be a string");
            }
        }

        return true;
    }

    static validateSubtype(data) {
        const subtype = data.subtype || data.details.subtype;
        if (!subtype) {
            throw new Error("Subtype is required");
        }
        if (typeof subtype !== 'string') {
            throw new Error("Subtype must be a string");
        }
        if (!BlindtestType.isValid(subtype)) {
            throw new Error("Invalid subtype");
        }

        return true;
    }

    static validateTitle(data) {
        const title = data.title || data.details.title;
        if (!title) {
            throw new Error("Title is required");
        }
        if (typeof title !== 'string') {
            throw new Error("Title must be a string");
        }
        if (title.length > this.constructor.TITLE_MAX_LENGTH) {
            throw new Error(`Title must be at most ${this.constructor.TITLE_MAX_LENGTH} characters`);
        }

        return true;
    }

    static typeToEmoji(type) {
        return BlindtestType.getEmoji(type);
    }

    static typeToTitle(type, lang = DEFAULT_LOCALE) {
        return BlindtestType.getTitle(type, lang);
    }

    static prependTypeWithEmoji(type, lang = DEFAULT_LOCALE) {
        return `${this.typeToEmoji(type)} ${this.typeToTitle(type, lang)}`;
    }
}

export class GameBlindtestQuestion extends GameBuzzerQuestion {
    static THINKING_TIME = 15;
    static REWARD = 1;
    static MAX_TRIES = 2;

    constructor(data) {
        super(data);
        this.constructor.validate(data);

        this.thinkingTime = data.thinkingTime || GameBlindtestQuestion.THINKING_TIME;
        this.reward = data.reward || GameBlindtestQuestion.REWARD;
        this.maxTries = data.maxTries || GameBlindtestQuestion.MAX_TRIES;
    }

    getQuestionType() {
        return QuestionType.BLINDTEST;
    }

    toObject() {
        return {
            ...super.toObject(),
            thinkingTime: this.thinkingTime,
            reward: this.reward,
            maxTries: this.maxTries
        };
    }

    static validate(data) {
        super.validate(data);

        this.validateThinkingTime(data);
        this.validateReward(data);
        this.validateMaxTries(data);

        return true;
    }

    static validateThinkingTime(data) {
        if (data.thinkingTime) {
            if (typeof data.thinkingTime !== 'number') {
                throw new Error("Thinking time must be a number");
            }
            if (data.thinkingTime < 0) {
                throw new Error("Thinking time must be positive");
            }
        }
        return true;
    }

    static validateReward(data) {
        if (data.reward) {
            if (typeof data.reward !== 'number') {
                throw new Error("Reward must be a number");
            }
        }
        return true;
    }

    static validateMaxTries(data) {
        if (data.maxTries) {
            if (typeof data.maxTries !== 'number') {
                throw new Error("Max tries must be a number");
            }
            if (data.maxTries < 0) {
                throw new Error("Max tries must be positive");
            }
        }
        return true;
    }
}
