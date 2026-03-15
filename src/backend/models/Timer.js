export const TimerStatus = {
  START: 'start',
  STOP: 'stop',
  RESET: 'reset',
  END: 'end',
};

export class Timer {
  static READY_COUNTDOWN_SECONDS = 5;
  static MIN_THINKING_TIME_SECONDS = 5;
  static MAX_THINKING_TIME_SECONDS = 120;
  static MIN_CHALLENGE_TIME_SECONDS = 5;
  static MAX_CHALLENGE_TIME_SECONDS = 120;

  constructor(status, duration, timestamp) {
    this.status = status;
    this.duration = duration;
    this.timestamp = timestamp;
  }
}
