import { RiddleQuestion, GameRiddleQuestion } from '@/backend/models/questions/Riddle';
import { emojiCount, onlyEmojis } from '@/backend/utils/emojis';
import { QuestionType } from '@/backend/models/questions/QuestionType';

// Emoji questions
export class EmojiQuestion extends RiddleQuestion {

    static TITLE_MAX_LENGTH = 50;
    static CLUE_MIN_LENGTH = 1;
    static CLUE_MAX_LENGTH = 10;

    static ANSWER_TITLE_MAX_LENGTH = 50;

    constructor(data) {
        super(data);
        this.constructor.validate(data);

        this.answer = data.answer || data.details.answer;
        this.clue = data.clue || data.details.clue;
        this.title = data.title || data.details.title;
    }

    getQuestionType() {
        return QuestionType.EMOJI;
    }


    toObject() {
        return {
            ...super.toObject(),
            details: {
                answer: this.answer,
                clue: this.clue,
                title: this.title
            }
        };
    }

    setImage(imageUrl) {
        this.answer.image = imageUrl;
    }


    static validate(data) {
        super.validate(data);

        this.validateAnswer(data);
        this.validateClue(data);
        this.validateTitle(data);

        return true;
    }
    
    static validateAnswer(data) {
        const answer = data.answer || data.details.answer;
        if (!answer) {
            throw new Error("Answer is required for Progressive Clues question");
        }
        if (!answer.title) {
            throw new Error("Answer title is required");
        }
        if (typeof answer.title !== 'string') {
            throw new Error("Answer title must be a string");
        }
        if (answer.title.length > this.constructor.ANSWER_TITLE_MAX_LENGTH) {
            throw new Error(`Answer title must be at most ${this.constructor.ANSWER_TITLE_MAX_LENGTH} characters`);
        }
        if (answer.image && typeof answer.image !== 'string') {
            throw new Error("Answer image must be a string URL");
        }

        return true;
    }

    static validateClue(data) {
        const clue = data.clue || data.details.clue;
        if (!clue) {
            throw new Error("Clue is required for Emoji question");
        }

        if (typeof clue !== 'string') {
            throw new Error("Clue must be a string");
        }

        const numEmojis = emojiCount(clue);

        if (!onlyEmojis(clue)) {
            throw new Error("Clue must contain only emojis");
        }

        if (numEmojis < this.constructor.CLUE_MIN_LENGTH) {
            throw new Error(`Clue must be at least ${this.constructor.CLUE_MIN_LENGTH} emojis`);
        }
        if (numEmojis > this.constructor.CLUE_MAX_LENGTH) {
            throw new Error(`Clue must be at most ${this.constructor.CLUE_MAX_LENGTH} emojis`);
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

    getClue() {
        return this.clue;
    }
    
    
}

export class GameEmojiQuestion extends GameRiddleQuestion {

    static REWARD = 1;
    static MAX_TRIES = 2;
    static THINKING_TIME = 15;

    constructor(data) {
        super(data);

        this.reward = data.reward || GameEmojiQuestion.REWARD;
        this.maxTries = data.maxTries || GameEmojiQuestion.MAX_TRIES;
        this.thinkingTime = data.thinkingTime || GameEmojiQuestion.THINKING_TIME;

        this.constructor.validate(data);

    }

    getQuestionType() {
        return QuestionType.EMOJI;
    }

    toObject() {
        return {
            ...super.toObject(),
            reward: this.reward,
            maxTries: this.maxTries,
            thinkingTime: this.thinkingTime
        };
    }
    
    static validate(data) {
        super.validate(data);

        this.validateReward(data);
        this.validateMaxTries(data);
        this.validateThinkingTime(data);

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

    getClue() {
        return this.clue;
    }
    
    
}
