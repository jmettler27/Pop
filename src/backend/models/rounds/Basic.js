import { BuzzerRound } from '@/backend/models/rounds/Buzzer';
import { RoundType } from '@/backend/models/rounds/RoundType';

export class BasicRound extends BuzzerRound {

    constructor(data) {
        super(data);
        this.type = RoundType.BASIC;
    }

    toObject() {
        return {
            ...super.toObject(),
            type: this.type,
        };
    }
}