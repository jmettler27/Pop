import { Participant, ParticipantRole, type ParticipantData } from '@/models/users/participant';

export const PlayerStatus = {
  IDLE: 'idle',
  CORRECT: 'correct',
  WRONG: 'wrong',
  FOCUS: 'focus',
  READY: 'ready',
} as const;

export type PlayerStatus = (typeof PlayerStatus)[keyof typeof PlayerStatus];

export interface PlayerData extends Omit<ParticipantData, 'role'> {
  joinedAt: unknown;
  status?: PlayerStatus;
  teamId: string;
}

export class Player extends Participant {
  readonly joinedAt: unknown;
  readonly status: PlayerStatus;
  readonly teamId: string;

  constructor(data: PlayerData) {
    super({ ...data, role: ParticipantRole.PLAYER });
    this.teamId = data.teamId;
    this.status = data.status ?? PlayerStatus.IDLE;
    this.joinedAt = data.joinedAt;
  }
}
