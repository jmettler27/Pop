import { Round } from '@/backend/models/rounds/Round';

export class RiddleRound extends Round {

    static MAX_TRIES = 2
    static DEFAULT_INVALIDATE_TEAM = false
    static DEFAULT_THINKING_TIME = 15
    static REWARDS_PER_QUESTION = 1

    constructor(data) {
        super(data);

        this.rewardsPerQuestion = data.rewardsPerQuestion || RiddleRound.REWARDS_PER_QUESTION;
        this.maxTries = data.maxTries || RiddleRound.MAX_TRIES;
        this.invalidateTeam = data.invalidateTeam || RiddleRound.DEFAULT_INVALIDATE_TEAM;
        this.thinkingTime = data.thinkingTime || RiddleRound.DEFAULT_THINKING_TIME;
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
