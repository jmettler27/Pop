import User, { type UserData } from '@/models/users/user';

export const ParticipantRole = {
  PLAYER: 'player',
  ORGANIZER: 'organizer',
  SPECTATOR: 'spectator',
} as const;

export type ParticipantRole = (typeof ParticipantRole)[keyof typeof ParticipantRole];

export interface ParticipantData extends UserData {
  role?: ParticipantRole;
}

export class Participant extends User {
  readonly role: ParticipantRole;

  constructor(data: ParticipantData) {
    super(data);
    this.role = data.role ?? ParticipantRole.SPECTATOR;
  }
}
