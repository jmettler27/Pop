import { Round } from '@/backend/models/rounds/Round';
import { RoundType } from '@/backend/models/rounds/RoundType';

export class EnumerationRound extends Round {

    static REWARDS_PER_QUESTION = 1
    static REWARDS_FOR_BONUS = 1

    static DEFAULT_REFLECTION_TIME = 60
    static DEFAULT_CHALLENGE_TIME = 60

    constructor(data) {
        super(data);
        this.type = RoundType.ENUMERATION;
        
        this.rewardsPerQuestion = data.rewardsPerQuestion || EnumerationRound.REWARDS_PER_QUESTION;
        this.reflectionTime = data.reflectionTime || EnumerationRound.DEFAULT_REFLECTION_TIME;
        this.challengeTime = data.challengeTime || EnumerationRound.DEFAULT_CHALLENGE_TIME;
        this.rewardsForBonus = data.rewardsForBonus || EnumerationRound.REWARDS_FOR_BONUS;
    }

    toObject() {
        return {
            ...super.toObject(),
            type: this.type,
            rewardsPerQuestion: this.rewardsPerQuestion,
            reflectionTime: this.reflectionTime,
            challengeTime: this.challengeTime,
            rewardsForBonus: this.rewardsForBonus
        };
    }
}