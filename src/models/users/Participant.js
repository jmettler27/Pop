import User from '@/models/users/User';

export const ParticipantRole = {
  PLAYER: 'player',
  ORGANIZER: 'organizer',
  SPECTATOR: 'spectator',
};

export class Participant extends User {
  constructor(role, data) {
    super(data);
    this.role = role;
  }

  getRole() {
    return this.role;
  }
}
