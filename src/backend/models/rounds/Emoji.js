import { RiddleRound } from '@/backend/models/rounds/Riddle';
import { RoundType } from '@/backend/models/rounds/RoundType';

export class EmojiRound extends RiddleRound {
    
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