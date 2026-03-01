import { Participant, ParticipantRole } from '@/backend/models/users/Participant';

export const PlayerStatus = {
  IDLE: 'idle',
  CORRECT: 'correct',
  WRONG: 'wrong',
  FOCUS: 'focus',
  READY: 'ready',
};

export class Player extends Participant {
  constructor(data) {
    super(ParticipantRole.PLAYER, data);
    this.teamId = data.teamId;
    this.status = data.status;
  }
}
