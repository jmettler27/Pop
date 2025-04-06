import { BaseQuestion, GameQuestion } from '@/backend/models/questions/Question';
import { isArray } from '@/backend/utils/arrays';
import { QuestionType } from '@/backend/models/questions/QuestionType';

// Label questions
export class LabellingQuestion extends BaseQuestion {

    static TITLE_MAX_LENGTH = 50;
    static NOTE_MAX_LENGTH = 500;
    static LABEL_MAX_LENGTH = 50;

    static MIN_NUM_LABELS = 2;
    static MAX_NUM_LABELS = 50;

    constructor(data) {
        super(data);
        this.constructor.validate(data);

        this.title = data.title || data.details.title;
        this.note = data.note || data.details.note;
        this.image = data.image || data.details.image;
        this.labels = data.labels || data.details.labels;
    }

    getQuestionType() {
        return QuestionType.LABELLING;
    }

    toObject() {
        return {
            ...super.toObject(),
            details: {
                title: this.title,
                note: this.note,
                image: this.image,
                labels: this.labels
            }
        };
    }

    setImage(imageUrl) {
        this.image = imageUrl;
    }

    static validate(data) {
        super.validate(data);

        this.validateTitle(data);
        this.validateNote(data);
        this.validateImage(data);
        this.validateLabels(data);

        return true;
    }

    static validateTitle(data) {
        const title = data.title || data.details.title;
        if (!title) {
            throw new Error("Labelling question must have a title");
        }
        if (typeof title !== 'string') {
            throw new Error("Labelling question title must be a string");
        }
        if (title.length > this.constructor.TITLE_MAX_LENGTH) {
            throw new Error(`Labelling question title must be at most ${this.constructor.TITLE_MAX_LENGTH} characters`);
        }

        return true;
    }

    static validateNote(data) {
        const note = data.note || data.details.note;
        if (note) {
            if (typeof note !== 'string') {
                throw new Error("Labelling question note must be a string");    
            }
            if (note.length > this.constructor.NOTE_MAX_LENGTH) {
                throw new Error(`Labelling question note must be at most ${this.constructor.NOTE_MAX_LENGTH} characters`);
            }
        }

        return true;
    }
    
    static validateLabels(data) {
        const labels = data.labels || data.details.labels;
        if (!labels) {
            throw new Error("Labelling question must have labels");
        }
        if (!isArray(labels)) {
            throw new Error("Labelling question labels must be an array");
        }
        if (labels.length < this.constructor.MIN_NUM_LABELS) {
            throw new Error(`Labelling question must have at least ${this.constructor.MIN_NUM_LABELS} labels`);
        }
        if (labels.length > this.constructor.MAX_NUM_LABELS) {
            throw new Error(`Labelling question must have at most ${this.constructor.MAX_NUM_LABELS} labels`);
        }

        return true;
    }

    static validateImage(data) {
        const image = data.image || data.details.image;
        if (!image) {
            throw new Error("Labelling question must have an image");
        }
        if (typeof image !== 'string') {
            throw new Error("Labelling question image must be a string");
        }
        if (image.length > this.constructor.IMAGE_MAX_LENGTH) {
            throw new Error(`Labelling question image must be at most ${this.constructor.IMAGE_MAX_LENGTH} characters`);
        }

        return true;
    }
    

    getInitialRevealed() {
        return this.labels.map(() => ({}));
    }

    getAllLabelsRevealed(playerId) {
        return this.labels.map(() => ({ playerId, timestamp: new Date() }));
    }

    isAllRevealed(revealed) {
        return revealed.every(label => Object.keys(label).length > 0);
    }

    calculatePoints(rewardsPerElement) {
        return this.labels.length * rewardsPerElement;
    }
}

export class GameLabellingQuestion extends GameQuestion {

    static REWARDS_PER_ELEMENT = 1;
    static MAX_TRIES = 1;
    static THINKING_TIME = 30;

    constructor(data) {
        super(data);

        this.revealed = data.revealed || [];

        this.constructor.validate(data);

    }

    toObject() {
        return {
            ...super.toObject(),
            revealed: this.revealed,
            reward: this.reward,
            maxTries: this.maxTries,
            thinkingTime: this.thinkingTime
        };
    }

    getQuestionType() {
        return QuestionType.LABELLING;
    }

    getInitialRevealed() {
        return Array.from({ length: this.labels.length }, () => ({}));
    }

    static validate(data) {
        super.validate(data);

        this.validateRevealed(data);
        this.validateReward(data);
        this.validateMaxTries(data);
        this.validateThinkingTime(data);

        return true;
    }

    static validateRevealed(data) {
        const revealed = data.revealed;
        if (!revealed) {
            throw new Error("Labelling question must have revealed");
        }
        if (!isArray(revealed)) {
            throw new Error("Labelling question revealed must be an array");
        }
        if (revealed.length !== this.constructor.MAX_TRIES) {
            throw new Error(`Labelling question must have ${this.constructor.MAX_TRIES} revealed`);
        }
        return true;
    }

    static validateReward(data) {
        const reward = data.reward;
        if (!reward) {
            throw new Error("Labelling question must have reward");
        }
        if (typeof reward !== 'number') {
            throw new Error("Labelling question reward must be a number");
        }
        if (reward < 0) {
            throw new Error("Labelling question reward must be positive");
        }
        return true;
    }

    static validateMaxTries(data) {
        const maxTries = data.maxTries;
        if (!maxTries) {
            throw new Error("Labelling question must have max tries");
        }
        if (typeof maxTries !== 'number') {
            throw new Error("Labelling question max tries must be a number");
        }
        if (maxTries < 0) {
            throw new Error("Labelling question max tries must be positive");
        }
        return true;
    }

    static validateThinkingTime(data) {
        const thinkingTime = data.thinkingTime;
        if (!thinkingTime) {
            throw new Error("Labelling question must have thinking time");
        }
        if (typeof thinkingTime !== 'number') {
            throw new Error("Labelling question thinking time must be a number");
        }
        if (thinkingTime < 0) {
            throw new Error("Labelling question thinking time must be positive");
        }
        return true;
    }

    reset() {
        super.reset();
        this.revealed = [];
    }
}

// import { isObjectEmpty } from "@/backend/utils";

// export function labelIsRevealed(revealed, labelIdx) {
//     const revealedObj = revealed[labelIdx]
//     return revealedObj && !isObjectEmpty(revealedObj)
// }

// export function atLeastOneLabelIsRevealed(revealed) {
//     return revealed.some(revealedObj => !isObjectEmpty(revealedObj))
// }