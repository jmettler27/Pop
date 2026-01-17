import { BuzzerRound } from '@/backend/models/rounds/Buzzer';
import { RoundType } from '@/backend/models/rounds/RoundType';

export class EmojiRound extends BuzzerRound {
    
    constructor(data) {
        super(data);
        this.type = RoundType.EMOJI;
    }

    toObject() {
        return {
            ...super.toObject(),
            type: this.type,
        };
    }
}