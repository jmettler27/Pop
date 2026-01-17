import { Round } from '@/backend/models/rounds/Round';

export class BuzzerRound extends Round {

    static MAX_TRIES = 2
    static DEFAULT_INVALIDATE_TEAM = false
    static DEFAULT_THINKING_TIME = 15
    static REWARDS_PER_QUESTION = 1

    constructor(data) {
        super(data);

        this.rewardsPerQuestion = data.rewardsPerQuestion || BuzzerRound.REWARDS_PER_QUESTION;
        this.maxTries = data.maxTries || BuzzerRound.MAX_TRIES;
        this.invalidateTeam = data.invalidateTeam || BuzzerRound.DEFAULT_INVALIDATE_TEAM;
        this.thinkingTime = data.thinkingTime || BuzzerRound.DEFAULT_THINKING_TIME;
    }

    toObject() {
        return {
            ...super.toObject(),
            rewardsPerQuestion: this.rewardsPerQuestion,
            maxTries: this.maxTries,
            invalidateTeam: this.invalidateTeam,
            thinkingTime: this.thinkingTime
        };
    }

    calculateMaxPointsTransaction() {
        this.maxPoints = this.getNumQuestions() * this.rewardsPerQuestion;
    }

    getMaxPoints() {
        return this.maxPoints;
    }

    getMaxTries() {
        return this.maxTries;
    }

    getInvalidateTeam() {
        return this.invalidateTeam;
    }

    getRewardsPerQuestion() {
        return this.rewardsPerQuestion;
    }

    getThinkingTime() {
        return this.thinkingTime;
    }
}
