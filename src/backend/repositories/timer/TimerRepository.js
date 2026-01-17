import { TimerStatus } from '@/backend/models/Timer';
import { Timer } from '@/backend/models/Timer';

import FirebaseDocumentRepository from '@/backend/repositories/FirebaseDocumentRepository';
import { serverTimestamp } from 'firebase/firestore';

export default class TimerRepository extends FirebaseDocumentRepository {
  constructor(gameId) {
    super(['games', gameId, 'realtime', 'timer']);
  }

  async createTimerState(organizerId) {
    return await this.set({
      authorized: false,
      duration: Timer.READY_COUNTDOWN_SECONDS,
      forward: false,
      managedBy: organizerId,
      status: TimerStatus.RESET,
    });
  }

  async initializeTimerTransaction(transaction, organizerId) {
    return await super.setTransaction(transaction, {
      authorized: false,
      duration: Timer.READY_COUNTDOWN_SECONDS,
      forward: false,
      managedBy: organizerId,
      status: TimerStatus.RESET,
      // timestamp: new Date()
    });
  }

  async updateTimerStatusTransaction(transaction, status, duration = 30) {
    return await this.updateTransaction(transaction, {
      status,
      duration,
      timestamp: serverTimestamp(),
    });
  }

  async startTimerTransaction(transaction, duration = 30) {
    return await this.updateTimerStatusTransaction(transaction, TimerStatus.START, duration);
  }

  async pauseTimerTransaction(transaction) {
    return await this.updateTimerStatusTransaction(transaction, TimerStatus.STOP);
  }

  async resetTimerTransaction(transaction, duration = 30) {
    return await this.updateTimerStatusTransaction(transaction, TimerStatus.RESET, duration);
  }

  async endTimerTransaction(transaction) {
    return await this.updateTimerStatusTransaction(transaction, TimerStatus.END);
  }

  async setDuration(duration) {
    return await this.update({
      duration,
    });
  }

  async setForward(forward) {
    return await this.update({
      forward,
    });
  }

  async setAuthorized(authorized) {
    return await this.update({
      authorized,
    });
  }

  async prepareTimerForReadyTransaction(transaction) {
    return await this.updateTransaction(transaction, {
      status: TimerStatus.RESET,
      duration: Timer.READY_COUNTDOWN_SECONDS,
      authorized: false,
    });
  }

  // React hooks for real-time operations
  useTimer() {
    const { data, loading, error } = super.useDocument();
    return { timer: data, timerLoading: loading, timerError: error };
  }

  useTimerOnce() {
    const { data, loading, error } = super.useDocumentOnce();
    return { timer: data, timerLoading: loading, timerError: error };
  }
}
