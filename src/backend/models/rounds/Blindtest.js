import { RiddleRound } from '@/backend/models/rounds/Riddle';
import { RoundType } from '@/backend/models/rounds/RoundType';

export class BlindtestRound extends RiddleRound {
    
    constructor(data) {
        super(data);
        this.type = RoundType.BLINDTEST;
    }

    toObject() {
        return {
            ...super.toObject(),
            type: this.type,
        };
    }
}