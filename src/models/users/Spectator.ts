import { Participant, ParticipantRole, type ParticipantData } from '@/models/users/participant';

export class Spectator extends Participant {
  constructor(data: ParticipantData) {
    super({ ...data, role: ParticipantRole.SPECTATOR });
  }
}
