import { RiddleRound } from '@/backend/models/rounds/Riddle';
import { RoundType } from '@/backend/models/rounds/RoundType';

export class BasicRound extends RiddleRound {

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