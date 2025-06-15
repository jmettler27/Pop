import { Round } from '@/backend/models/rounds/Round';
import { RoundType } from '@/backend/models/rounds/RoundType';

export class NaguiRound extends Round {
    constructor(data) {
        super(data);
        this.type = RoundType.NAGUI;
    }

    toObject() {
        return {
            ...super.toObject(),
            type: this.type,
        };
    }
}