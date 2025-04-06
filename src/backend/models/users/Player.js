import { User } from '@/backend/models/users/User'

export const PlayerStatus = {
    IDLE: 'idle',
    CORRECT: 'correct',
    WRONG: 'wrong',
    FOCUS: 'focus',
    READY: 'ready',
}

export class Player extends User {
    constructor(data) {
        super(data);
        this.teamId = data.teamId;
        this.status = data.status;
    }

}
