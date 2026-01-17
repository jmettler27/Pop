export const TimerStatus = {
  START: 'start',
  STOP: 'stop',
  RESET: 'reset',
  END: 'end',
};

export class Timer {
  static READY_COUNTDOWN_SECONDS = 5;

  constructor(status, duration, timestamp) {
    this.status = status;
    this.duration = duration;
    this.timestamp = timestamp;
  }
}
