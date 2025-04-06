import { RiddleQuestion, GameRiddleQuestion } from '@/backend/models/questions/Riddle';
import { QuestionType } from '@/backend/models/questions/QuestionType';

// Image questions
export class ImageQuestion extends RiddleQuestion {

    static TITLE_MAX_LENGTH = 75;
    static ANSWER_SOURCE_MAX_LENGTH = 75;
    static ANSWER_DESCRIPTION_MAX_LENGTH = 75;

    static ELEMENTS = ['source', 'description'];

    constructor(data) {
        super(data);
        this.constructor.validate(data);

        this.answer = data.answer || data.details.answer;
        this.image = data.image || data.details.image;
        this.title = data.title || data.details.title;
    }

    getQuestionType() {
        return QuestionType.IMAGE;
    }

    toObject() {
        return {
            ...super.toObject(),
            details: {
                answer: this.answer,
                image: this.image,
                title: this.title
            }
        };
    }

    setImage(imageUrl) {
        this.image = imageUrl;
    }

    static validate(data) {
        super.validate(data);

        this.validateImage(data);
        this.validateTitle(data);
        this.validateAnswer(data);

        return true;
    }

    static validateImage(data) {
        const image = data.image || data.details.image;
        if (!image) {
            throw new Error("Image is required");
        }
        if (typeof image !== 'string') {
            throw new Error("Image must be a string");
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

    static validateAnswer(data) {
        const answer = data.answer || data.details.answer;
        if (!answer) {
            throw new Error("Answer is required");
        }
        if (typeof answer !== 'object') {
            throw new Error("Answer must be a string");
        }
        if (!answer.source) {
            throw new Error("Answer must have a source");
        }
        if (typeof answer.source !== 'string') {
            throw new Error("Answer source must be a string");
        }
        if (answer.source.length > this.constructor.ANSWER_SOURCE_MAX_LENGTH) {
            throw new Error(`Answer source must be at most ${this.constructor.ANSWER_SOURCE_MAX_LENGTH} characters`);
        }
        if (!answer.description) {
            throw new Error("Answer must have a description");
        }
        if (typeof answer.description !== 'string') {
            throw new Error("Answer description must be a string");
        }
        if (answer.description.length > this.constructor.ANSWER_DESCRIPTION_MAX_LENGTH) {
            throw new Error(`Answer description must be at most ${this.constructor.ANSWER_DESCRIPTION_MAX_LENGTH} characters`);
        }

        return true;
    }

}

export class GameImageQuestion extends GameRiddleQuestion {

    static THINKING_TIME = 15;
    static REWARD = 1;
    static MAX_TRIES = 2;

    constructor(data) {
        super(data);
        this.constructor.validate(data);

        this.thinkingTime = data.thinkingTime || GameImageQuestion.THINKING_TIME;
        this.reward = data.reward || GameImageQuestion.REWARD;
        this.maxTries = data.maxTries || GameImageQuestion.MAX_TRIES;
    }
    
    getQuestionType() {
        return QuestionType.IMAGE;
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
        const thinkingTime = data.thinkingTime;
        if (!thinkingTime) {
            throw new Error("Thinking time is required");
        }
        if (typeof thinkingTime !== 'number') {
            throw new Error("Thinking time must be a number");
        }
        if (thinkingTime < 0) {
            throw new Error("Thinking time must be positive");
        }
        return true;
    }
    
    static validateReward(data) {
        const reward = data.reward;
        if (!reward) {
            throw new Error("Reward is required");
        }
        if (typeof reward !== 'number') {
            throw new Error("Reward must be a number");
        }
        if (reward < 0) {
            throw new Error("Reward must be positive");
        }
        return true;
    }

    static validateMaxTries(data) {
        const maxTries = data.maxTries;
        if (!maxTries) {
            throw new Error("Max tries is required");
        }
        if (typeof maxTries !== 'number') {
            throw new Error("Max tries must be a number");
        }
        if (maxTries < 0) {
            throw new Error("Max tries must be positive");
        }
        return true;
    }

}