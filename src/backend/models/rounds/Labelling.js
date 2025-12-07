import { Round } from '@/backend/models/rounds/Round';
import { RoundType } from '@/backend/models/rounds/RoundType';

export class LabellingRound extends Round {
    
    static MAX_TRIES = 1
    static DEFAULT_INVALIDATE_TEAM = false
    static DEFAULT_THINKING_TIME = 30
    static REWARDS_PER_ELEMENT = 1

    constructor(data) {
        super(data);
        this.type = RoundType.LABELLING;

        this.maxTries = data.maxTries || LabellingRound.MAX_TRIES;
        this.invalidateTeam = data.invalidateTeam || LabellingRound.DEFAULT_INVALIDATE_TEAM;
        this.thinkingTime = data.thinkingTime || LabellingRound.DEFAULT_THINKING_TIME;
        this.rewardsPerElement = data.rewardsPerElement || LabellingRound.REWARDS_PER_ELEMENT;
    }

    toObject() {
        return {
            ...super.toObject(),
            type: this.type,
            maxTries: this.maxTries,
            invalidateTeam: this.invalidateTeam,
            thinkingTime: this.thinkingTime,
            rewardsPerElement: this.rewardsPerElement
        };
    }
    
    calculateMaxPointsTransaction() {
        // The total number of quote elements to guess in the round
        return this.questions.reduce((acc, { details: { labels } }) => {
            return acc + labels.length;
        }, 0) * this.rewardsPerElement;
    }
}
