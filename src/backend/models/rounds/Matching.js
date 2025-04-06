import { Round } from '@/backend/models/rounds/Round';
import { RoundType } from '@/backend/models/rounds/RoundType';

export class MatchingRound extends Round {

    static DEFAULT_MAX_MISTAKES = 3
    static DEFAULT_MISTAKE_PENALTY = -5

    constructor(data) {
        super(data);
        this.type = RoundType.MATCHING;
        
        this.mistakePenalty = data.mistakePenalty || MatchingRound.DEFAULT_MISTAKE_PENALTY;
        this.maxMistakes = data.maxMistakes || MatchingRound.DEFAULT_MAX_MISTAKES;
    }

    toObject() {
        return {
            ...super.toObject(),
            type: this.type,
            mistakePenalty: this.mistakePenalty,
            maxMistakes: this.maxMistakes
        };
    }

    getMistakePenalty() {
        return this.mistakePenalty;
    }

    getMaxMistakes() {
        return this.maxMistakes;
    }
}