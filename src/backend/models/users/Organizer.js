import { Participant, ParticipantRole } from '@/backend/models/users/Participant';

export class Organizer extends Participant {
  constructor(data) {
    super(ParticipantRole.ORGANIZER, data);
  }
}
