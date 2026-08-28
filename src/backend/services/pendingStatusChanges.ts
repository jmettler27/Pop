import type { Transaction } from 'firebase-admin/firestore';

import type PlayerRepository from '@/backend/repositories/user/PlayerRepository';
import { adminDb } from '@/firebase/admin';

type PendingStatusChange =
  | { kind: 'team'; teamId: string; status: string }
  | { kind: 'teamAndOthers'; teamId: string; teamStatus: string; otherStatus: string };

/**
 * Collects whole-team player-status changes requested during a Firestore
 * transaction and applies them **after** it commits.
 *
 * Player-status fan-out rewrites every player doc of a team and has always been a
 * standalone batch, never part of the surrounding transaction. Committing that
 * batch from inside a `runTransaction` callback deadlocks the admin SDK against
 * the Firestore emulator: the emulator takes pessimistic locks, so the batch
 * waits on the open transaction's locks while the transaction waits on the
 * callback. Deferring the fan-out to just after the commit keeps the identical
 * observable effect (the status write was never atomic with the transaction)
 * without the deadlock, and without any read-before-write reordering.
 *
 * One instance per service instance; a service instance handles one request at a
 * time, so the queue is not shared across concurrent transactions.
 */
export class PendingStatusChanges {
  private queue: PendingStatusChange[] = [];

  constructor(private readonly playerRepo: PlayerRepository) {}

  enqueueTeam(teamId: string, status: string): void {
    this.queue.push({ kind: 'team', teamId, status });
  }

  enqueueTeamAndOthers(teamId: string, teamStatus: string, otherStatus: string): void {
    this.queue.push({ kind: 'teamAndOthers', teamId, teamStatus, otherStatus });
  }

  /** Run `fn` in a transaction, then flush the status changes it enqueued. */
  async runTransaction<T>(fn: (transaction: Transaction) => Promise<T>): Promise<T> {
    const result = await adminDb().runTransaction(async (transaction) => {
      this.queue = []; // reset per attempt: runTransaction re-runs the callback on contention
      return fn(transaction);
    });
    await this.flush();
    return result;
  }

  private async flush(): Promise<void> {
    const changes = this.queue;
    this.queue = [];
    for (const change of changes) {
      if (change.kind === 'team') {
        await this.playerRepo.updateTeamPlayersStatus(change.teamId, change.status);
      } else {
        await this.playerRepo.updateTeamAndOtherTeamsPlayersStatus(
          change.teamId,
          change.teamStatus,
          change.otherStatus
        );
      }
    }
  }
}
