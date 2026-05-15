export const TimerStatus = {
  START: 'start',
  STOP: 'stop',
  RESET: 'reset',
  END: 'end',
} as const;

export type TimerStatus = (typeof TimerStatus)[keyof typeof TimerStatus];

export interface TimerData {
  authorized: boolean;
  duration: number;
  forward: boolean;
  managedBy: string;
  status: TimerStatus;
  timestamp: unknown;
}

export class Timer {
  static READY_COUNTDOWN_SECONDS = 5;
  static MIN_THINKING_TIME_SECONDS = 5;
  static MAX_THINKING_TIME_SECONDS = 120;
  static MIN_CHALLENGE_TIME_SECONDS = 5;
  static MAX_CHALLENGE_TIME_SECONDS = 120;

  authorized: boolean;
  duration: number;
  forward: boolean;
  managedBy: string;
  status: TimerStatus;
  timestamp: unknown;

  constructor(data: TimerData) {
    this.authorized = data.authorized;
    this.duration = data.duration;
    this.forward = data.forward;
    this.managedBy = data.managedBy;
    this.status = data.status;
    this.timestamp = data.timestamp;
  }
}
