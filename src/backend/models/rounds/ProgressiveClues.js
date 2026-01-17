import { BuzzerRound } from '@/backend/models/rounds/Buzzer';
import { RoundType } from '@/backend/models/rounds/RoundType';

export class ProgressiveCluesRound extends BuzzerRound {

    static DEFAULT_DELAY = 2

    constructor(data) {
        super(data);
        this.type = RoundType.PROGRESSIVE_CLUES;

        this.delay = data.delay || ProgressiveCluesRound.DEFAULT_DELAY;
    }

    toObject() {
        return {
            ...super.toObject(),
            type: this.type,
            delay: this.delay
        };
    }

    getDelay() {
        return this.delay;
    }

}