import { BaseQuestion, GameQuestion } from '@/backend/models/questions/Question';
import { isArray } from '@/backend/utils/arrays';
import { QuestionType } from '@/backend/models/questions/QuestionType';

export class EnumerationQuestion extends BaseQuestion {

    static TITLE_MAX_LENGTH = 75;
    static NOTE_MAX_LENGTH = 500;

    static ANSWER_ITEM_MAX_LENGTH = 50;

    static MIN_NUM_ANSWERS = 2;
    static MAX_NUM_ANSWERS = 100;

    constructor(data) {
        super(data);
        this.constructor.validate(data);

        this.answer = data.answer || data.details.answer;
        this.challengeTime = data.challengeTime || data.details.challengeTime;
        this.thinkingTime = data.thinkingTime || data.details.thinkingTime;
        this.maxIsKnown = data.maxIsKnown || data.details.maxIsKnown;
        this.note = data.note || data.details.note;
        this.title = data.title || data.details.title;
    }

    getQuestionType() {
        return QuestionType.ENUMERATION;
    }


    toObject() {
        return {
            ...super.toObject(),
            details: {
                answer: this.answer,
                challengeTime: this.challengeTime,
                thinkingTime: this.thinkingTime,
                maxIsKnown: this.maxIsKnown,
                note: this.note,
                title: this.title
            }
        };
    }

    static validate(data) {
        super.validate(data);

        this.validateAnswer(data);
        this.validateChallengeTime(data);
        this.validateThinkingTime(data);
        this.validateMaxIsKnown(data);
        this.validateNote(data);
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
        if (!isArray(answer)) {
            throw new Error("Answer must be an array");
        }
        if (answer.length < this.constructor.MIN_NUM_ANSWERS) { 
            throw new Error("Answer must have at least 2 answers");
        }
        if (answer.length > this.constructor.MAX_NUM_ANSWERS) {
            throw new Error("Answer must have at most 100 answers");
        }
        for (let i = 0; i < answer.length; i++) {
            const item = answer[i];
            if (typeof item !== 'string') {
                throw new Error("Answer must be an array of strings");
            }
            if (item.length > this.constructor.ANSWER_ITEM_MAX_LENGTH) {
                throw new Error("Answer must be at most 50 characters");
            }
        }

        return true;
    }

    static validateChallengeTime(data) {
        const challengeTime = data.challengeTime || data.details.challengeTime;
        if (typeof challengeTime !== 'number') {
            throw new Error("Challenge time must be a number");
        }
        if (challengeTime < this.constructor.MIN_CHALLENGE_SECONDS) {
            throw new Error("Challenge time must be at least 30 seconds");
        }
        if (challengeTime > this.constructor.MAX_CHALLENGE_SECONDS) {
            throw new Error("Challenge time must be at most 120 seconds");
        }

        return true;
    }
    
    static validateThinkingTime(data) {
        const thinkingTime = data.thinkingTime || data.details.thinkingTime;
        if (typeof thinkingTime !== 'number') {
            throw new Error("Thinking time must be a number");
        }
        if (thinkingTime < this.constructor.MIN_THINKING_SECONDS) {
            throw new Error("Thinking time must be at least 60 seconds");
        }
        if (thinkingTime > this.constructor.MAX_THINKING_SECONDS) {
            throw new Error("Thinking time must be at most 300 seconds");
        }

        return true;
    }
    
    static validateMaxIsKnown(data) {
        const maxIsKnown = data.maxIsKnown || data.details.maxIsKnown;
        if (typeof maxIsKnown !== 'boolean') {
            throw new Error("Max is known must be a boolean");
        }

        return true;
    }

    static validateNote(data) {
        const note = data.note || data.details.note;
        if (note) {
            if (typeof note !== 'string') {
                throw new Error("Note must be a string");
            }
            if (note.length > this.constructor.NOTE_MAX_LENGTH) {
                throw new Error("Note must be at most 500 characters");
            }
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
            throw new Error("Title must be at most 75 characters");
        }

        return true;
    }

}

export const EnumerationQuestionStatus = {
    REFLECTION: 'reflection_active',
    CHALLENGE: 'challenge_active',
}

export class GameEnumerationQuestion extends GameQuestion {

    static REWARD = 1;
    static DEFAULT_BONUS = 1;

    static THINKING_TIME = 60;
    static MIN_THINKING_SECONDS = 60;
    static MAX_THINKING_SECONDS = 60 * 5;

    static CHALLENGE_TIME = 30;
    static MIN_CHALLENGE_SECONDS = 30;
    static MAX_CHALLENGE_SECONDS = 60 * 2;

    constructor(data) {
        super(data);

        this.status = data.status || EnumerationQuestionStatus.REFLECTION;
        this.reward = data.reward || GameEnumerationQuestion.REWARD;
        this.rewardsForBonus = data.rewardsForBonus || GameEnumerationQuestion.DEFAULT_BONUS;
        this.thinkingTime = data.thinkingTime || GameEnumerationQuestion.THINKING_TIME;
        this.challengeTime = data.challengeTime || GameEnumerationQuestion.CHALLENGE_TIME;

        this.constructor.validate(data);

    }

    toObject() {
        return {
            ...super.toObject(),
            status: this.status,
            reward: this.reward,
            rewardsForBonus: this.rewardsForBonus,
            thinkingTime: this.thinkingTime,
            challengeTime: this.challengeTime,
        };
    }

    getQuestionType() {
        return QuestionType.ENUMERATION;
    }

    static validate(data) {
        super.validate(data);

        this.validateStatus(data);
        this.validateReward(data);
        this.validateRewardsForBonus(data);
        this.validateThinkingTime(data);
        this.validateChallengeTime(data);

        return true;
    }

    static validateStatus(data) {
        if (data.status) {
            if (typeof data.status !== 'string') {
                throw new Error("Status must be a string");
            }
            if (!Object.values(EnumerationQuestionStatus).includes(data.status)) {
                throw new Error(`Invalid status: ${data.status}`);
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

    static validateRewardsForBonus(data) {
        if (data.rewardsForBonus) {
            if (typeof data.rewardsForBonus !== 'number') {
                throw new Error("Rewards for bonus must be a number");
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

    static validateChallengeTime(data) {
        if (data.challengeTime) {
            if (typeof data.challengeTime !== 'number') {
                throw new Error("Challenge time must be a number");
            }
            if (data.thinkingTime < 0) {
                throw new Error("Thinking time must be positive");
            }
        }
        return true;
    }

    static findHighestBidder(bets) {
        if (!isArray(bets) || bets.length === 0) {
            throw new Error("Invalid input: bets must be a non-empty array");
        }
    
        // Note: since players are appended to the array in the order they bet, the first player with the max bet is the challenger
        const playerWithMaxBet = bets.reduce((max, current) => current.bet > max.bet ? current : max, bets[0]);
    
        return [playerWithMaxBet.playerId, playerWithMaxBet.teamId, playerWithMaxBet.bet];
    }
}