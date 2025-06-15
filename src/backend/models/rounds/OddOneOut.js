import { Round } from '@/backend/models/rounds/Round';
import { RoundType } from '@/backend/models/rounds/RoundType';

export class OddOneOutRound extends Round {

    static DEFAULT_MISTAKE_PENALTY = -10;
    static DEFAULT_THINKING_TIME = 30;

    constructor(data) {
        super(data);
        this.type = RoundType.ODD_ONE_OUT;
        
        this.mistakePenalty = data.mistakePenalty || OddOneOutRound.DEFAULT_MISTAKE_PENALTY;
        this.thinkingTime = data.thinkingTime || OddOneOutRound.DEFAULT_THINKING_TIME;
    }

    toObject() {
        return {
            ...super.toObject(),
            type: this.type,
            mistakePenalty: this.mistakePenalty,
            thinkingTime: this.thinkingTime
        };
    }

    getMistakePenalty() {
        return this.mistakePenalty;
    }

    getThinkingTime() {
        return this.thinkingTime;
    }
}