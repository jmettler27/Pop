import { RiddleRound } from '@/backend/models/rounds/Riddle';
import { RoundType } from '@/backend/models/rounds/RoundType';

export class ImageRound extends RiddleRound {
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