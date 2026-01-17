import { BuzzerRound } from '@/backend/models/rounds/Buzzer';
import { RoundType } from '@/backend/models/rounds/RoundType';

export class ImageRound extends BuzzerRound {
    constructor(data) {
        super(data);
        this.type = RoundType.IMAGE;
    }

    toObject() {
        return {
            ...super.toObject(),
            type: this.type,
        };
    }
}