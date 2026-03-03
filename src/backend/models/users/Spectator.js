import { Participant, ParticipantRole } from '@/backend/models/users/Participant';

export class Spectator extends Participant {
  constructor(data) {
    super(ParticipantRole.SPECTATOR, data);
  }
}
