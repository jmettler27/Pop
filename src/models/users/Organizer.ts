import { Participant, ParticipantRole, type ParticipantData } from '@/models/users/participant';

export class Organizer extends Participant {
  constructor(data: ParticipantData) {
    super({ ...data, role: ParticipantRole.ORGANIZER });
  }
}
