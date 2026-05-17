import { serverTimestamp, Timestamp, type Transaction } from 'firebase/firestore';

import FirebaseDocumentRepository from '@/backend/repositories/FirebaseDocumentRepository';
import { Timer, TimerStatus } from '@/models/timer';

export default class TimerRepository extends FirebaseDocumentRepository {
  constructor(gameId: string) {
    super(['games', gameId, 'realtime', 'timer']);
  }

  async initializeTimer(organizerId: string): Promise<void> {
    await this.set({
      authorized: false,
      duration: Timer.READY_COUNTDOWN_SECONDS,
      forward: false,
      managedBy: organizerId,
      status: TimerStatus.RESET,
    });
  }

  async updateTimerTransaction(
    transaction: Transaction,
    data: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    return super.updateTransaction(transaction, data);
  }

  async getTimerTransaction(transaction: Transaction): Promise<Timer | undefined> {
    const result = this.getTransaction(transaction);
    return result ? (result as unknown as Timer) : undefined;
  }

  async initializeTimerTransaction(transaction: Transaction, organizerId: string): Promise<void> {
    await super.setTransaction(transaction, {
      authorized: false,
      duration: Timer.READY_COUNTDOWN_SECONDS,
      forward: false,
      managedBy: organizerId,
      status: TimerStatus.RESET,
    });
  }

  async startTimerTransaction(transaction: Transaction, duration: number | null = null): Promise<void> {
    const updateData: Record<string, unknown> = {
      status: TimerStatus.START,
      timestamp: serverTimestamp(),
    };
    if (duration != null) {
      updateData.duration = duration;
    }
    await this.updateTimerTransaction(transaction, updateData);
  }

  async stopTimerTransaction(transaction: Transaction): Promise<void> {
    const timer = await this.getTimerTransaction(transaction);
    if (!timer || timer.status !== TimerStatus.START) {
      await this.updateTimerTransaction(transaction, { status: TimerStatus.STOP });
      return;
    }
    const now = Timestamp.now();
    const timestamp = timer.timestamp as Timestamp;
    const elapsedSec = (now.toMillis() - timestamp.toMillis()) / 1000;
    const remaining = Math.max((timer.duration as number) - elapsedSec, 0);
    await this.updateTimerTransaction(transaction, { status: TimerStatus.STOP, duration: remaining });
  }

  async updateTimerStatusTransaction(transaction: Transaction, status: TimerStatus): Promise<void> {
    await this.updateTimerTransaction(transaction, { status });
  }

  async resetTimerTransaction(transaction: Transaction, duration: number = 30): Promise<void> {
    await this.updateTimerTransaction(transaction, { status: TimerStatus.RESET, duration });
  }

  async endTimerTransaction(transaction: Transaction): Promise<void> {
    await this.updateTimerTransaction(transaction, { status: TimerStatus.END });
  }

  async updateDurationTransaction(transaction: Transaction, duration: number): Promise<void> {
    await this.updateTimerTransaction(transaction, { duration });
  }

  async setForward(forward: boolean): Promise<void> {
    await this.update({ forward });
  }

  async updateAuthorized(authorized: boolean): Promise<void> {
    await this.update({ authorized });
  }

  async prepareTimerForReadyTransaction(transaction: Transaction): Promise<void> {
    await this.updateTimerTransaction(transaction, {
      status: TimerStatus.RESET,
      duration: Timer.READY_COUNTDOWN_SECONDS,
      authorized: false,
    });
  }

  useTimer() {
    const { data, loading, error } = super.useDocument();
    return { timer: data, timerLoading: loading, timerError: error };
  }

  useTimerOnce() {
    const { data, loading, error } = super.useDocumentOnce();
    return { timer: data, timerLoading: loading, timerError: error };
  }
}
