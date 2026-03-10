import { TimerStatus } from '@/backend/models/Timer';
import { Timer } from '@/backend/models/Timer';

import FirebaseDocumentRepository from '@/backend/repositories/FirebaseDocumentRepository';
import { serverTimestamp, Timestamp } from 'firebase/firestore';

export default class TimerRepository extends FirebaseDocumentRepository {
  constructor(gameId) {
    super(['games', gameId, 'realtime', 'timer']);
  }

  async initializeTimer(organizerId) {
    await this.set({
      authorized: false,
      duration: Timer.READY_COUNTDOWN_SECONDS,
      forward: false,
      managedBy: organizerId,
      status: TimerStatus.RESET,
    });
  }

  async updateTimerTransaction(transaction, data) {
    return await super.updateTransaction(transaction, data);
  }

  async getTimerTransaction(transaction) {
    return await super.getTransaction(transaction);
  }

  async initializeTimerTransaction(transaction, organizerId) {
    await super.setTransaction(transaction, {
      authorized: false,
      duration: Timer.READY_COUNTDOWN_SECONDS,
      forward: false,
      managedBy: organizerId,
      status: TimerStatus.RESET,
    });
  }

  async startTimerTransaction(transaction, duration) {
    const updateData = {
      status: TimerStatus.START,
      timestamp: serverTimestamp(),
    };
    // If duration is provided, use it (fresh start). Otherwise keep current duration (resume from pause).
    if (duration != null) {
      updateData.duration = duration;
    }
    await this.updateTimerTransaction(transaction, updateData);
  }

  async stopTimerTransaction(transaction) {
    // Read current timer to compute remaining time
    const timerData = await this.getTimerTransaction(transaction);
    if (!timerData || timerData.status !== TimerStatus.START) {
      // Only compute remaining if the timer was running
      await this.updateTimerTransaction(transaction, {
        status: TimerStatus.STOP,
      });
      return;
    }

    const now = Timestamp.now();
    const elapsedSec = (now.toMillis() - timerData.timestamp.toMillis()) / 1000;
    const remaining = Math.max(timerData.duration - elapsedSec, 0);

    await this.updateTimerTransaction(transaction, {
      status: TimerStatus.STOP,
      duration: remaining,
    });
  }

  async resetTimerTransaction(transaction, duration = 30) {
    await this.updateTimerTransaction(transaction, {
      status: TimerStatus.RESET,
      duration,
    });
  }

  async endTimerTransaction(transaction) {
    await this.updateTimerTransaction(transaction, {
      status: TimerStatus.END,
    });
  }

  async updateDurationTransaction(transaction, duration) {
    await this.updateTimerTransaction(transaction, {
      duration,
    });
  }

  async setForward(forward) {
    await this.update({
      forward,
    });
  }

  async updateAuthorized(authorized) {
    await this.update({
      authorized,
    });
  }

  async prepareTimerForReadyTransaction(transaction) {
    await this.updateTimerTransaction(transaction, {
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
