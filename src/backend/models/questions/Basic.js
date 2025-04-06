import { RiddleQuestion, GameRiddleQuestion } from '@/backend/models/questions/Riddle';
import { QuestionType } from '@/backend/models/questions/QuestionType';

// Basic questions
export class BasicQuestion extends RiddleQuestion {

    static TITLE_MAX_LENGTH = 100;
    static ANSWER_MAX_LENGTH = 50;
    static SOURCE_MAX_LENGTH = 75;

    constructor(data) {
        super(data);
        this.constructor.validate(data);

        this.answer = data.answer || data.details.answer;
        this.explanation = data.explanation || data.details.explanation;
        this.note = data.note || data.details.note;
        this.source = data.source || data.details.source;
        this.title = data.title || data.details.title;
    }

    getQuestionType() {
        return QuestionType.BASIC;
    }

    toObject() {
        return {
            ...super.toObject(),
            details: {
                answer: this.answer,
                explanation: this.explanation,
                note: this.note,
                source: this.source,
                title: this.title
            }
        };
    }

    static validate(data) {
        super.validate(data);

        this.validateAnswer(data);
        this.validateExplanation(data);
        this.validateNote(data);
        this.validateSource(data);
        this.validateTitle(data);

        return true;
    }

    static validateAnswer(data) {
        const answer = data.answer || data.details.answer;
        if (!answer) {
            throw new Error("Answer is required");
        }
        if (typeof answer !== 'string') {
            throw new Error("Answer must be a string");
        }
        if (answer.length > BasicQuestion.ANSWER_MAX_LENGTH) {
            throw new Error("Answer must be less than 50 characters");
        }

        return true;
    }

    static validateExplanation(data) {
        const explanation = data.explanation || data.details.explanation;
        if (explanation) {
            if (typeof explanation !== 'string') {
                throw new Error("Explanation must be a string");
            }
            if (explanation.length > BasicQuestion.EXPLANATION_MAX_LENGTH) {
                throw new Error("Explanation must be less than 50 characters");
            }
        }   
        return true;
    }

    static validateNote(data) {
        const note = data.note || data.details.note;
        if (note) {
            if (typeof note !== 'string') {
                throw new Error("Note must be a string");
            }
            if (note.length > BasicQuestion.NOTE_MAX_LENGTH) {
                throw new Error("Note must be less than 50 characters");
            }
        }
        return true;
    }

    static validateSource(data) {
        const source = data.source || data.details.source;
        if (source) {
            if (typeof source !== 'string') {
                throw new Error("Source must be a string");
            }
            if (source.length > BasicQuestion.SOURCE_MAX_LENGTH) {
                throw new Error("Source must be less than 75 characters");
            }
        }
        return true;
    }

    static validateTitle(data) {
        const title = data.title || data.details.title;
        if (typeof title !== 'string') {
            throw new Error("Title must be a string");
        }
        if (title.length > BasicQuestion.TITLE_MAX_LENGTH) {
            throw new Error("Title must be less than 100 characters");
        }
        return true;
    }
}


export class GameBasicQuestion extends GameRiddleQuestion {

    static REWARD = 1;
    static THINKING_TIME = 15;

    constructor(data) {
        super(data);

        this.reward = data.reward || GameBasicQuestion.REWARD;
        this.thinkingTime = data.thinkingTime || GameBasicQuestion.THINKING_TIME;

        this.constructor.validate(data);

    }

    getQuestionType() {
        return QuestionType.BASIC;
    }

    toObject() {
        return {
            ...super.toObject(),
            reward: this.reward,
            thinkingTime: this.thinkingTime
        };
    }

    static validate(data) {
        super.validate(data);

        this.validateReward(data);
        this.validateThinkingTime(data);

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
}
