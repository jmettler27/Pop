import { BuzzerRound } from '@/backend/models/rounds/Buzzer';
import { RoundType } from '@/backend/models/rounds/RoundType';

export class BlindtestRound extends BuzzerRound {
    
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