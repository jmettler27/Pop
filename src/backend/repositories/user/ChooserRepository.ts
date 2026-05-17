import { type Transaction } from 'firebase/firestore';

import FirebaseDocumentRepository from '@/backend/repositories/FirebaseDocumentRepository';
import { Chooser } from '@/models/chooser';

export default class ChooserRepository extends FirebaseDocumentRepository {
  constructor(gameId: string) {
    super(['games', gameId, 'realtime', 'states']);
  }

  async getChooserTransaction(transaction: Transaction): Promise<Chooser | undefined> {
    return (await this.getTransaction(transaction)) as Chooser | undefined;
  }

  async getChooserIdTransaction(transaction: Transaction): Promise<string | undefined> {
    const data = await this.getChooserTransaction(transaction);
    if (!data) return undefined;
    const chooserOrder = data.chooserOrder as string[];
    const chooserIdx = data.chooserIdx as number;
    return chooserOrder[chooserIdx];
  }

  async resetChoosersTransaction(transaction: Transaction): Promise<Chooser | null> {
    const result = await this.updateTransaction(transaction, { chooserIdx: 0 });
    return result ? (result as unknown as Chooser) : null;
  }

  async initializeChoosersTransaction(transaction: Transaction, chooserOrder: string[]): Promise<void> {
    await this.setTransaction(transaction, { chooserIdx: 0, chooserOrder });
  }

  async updateChooser(data: { chooserIdx: number; chooserOrder: string[] }): Promise<void> {
    await this.update({ chooserIdx: data.chooserIdx, chooserOrder: data.chooserOrder });
  }

  async updateChooserTransaction(
    transaction: Transaction,
    data: { chooserIdx: number; chooserOrder: string[] }
  ): Promise<void> {
    await this.updateTransaction(transaction, { chooserIdx: data.chooserIdx, chooserOrder: data.chooserOrder });
  }

  async updateChooserOrderTransaction(transaction: Transaction, order: string[]): Promise<void> {
    await this.updateTransaction(transaction, { chooserOrder: order });
  }

  async updateChooserIndexTransaction(transaction: Transaction, chooserIdx: number): Promise<void> {
    await this.updateTransaction(transaction, { chooserIdx });
  }

  async moveToNextChooserTransaction(transaction: Transaction): Promise<string | undefined> {
    const data = await this.getChooserTransaction(transaction);
    if (!data) return undefined;
    const chooserOrder = data.chooserOrder as string[];
    const chooserIdx = data.chooserIdx as number;
    const newChooserIdx = (chooserIdx + 1) % chooserOrder.length;
    const newChooserTeamId = chooserOrder[newChooserIdx];
    await this.updateChooserIndexTransaction(transaction, newChooserIdx);
    return newChooserTeamId;
  }

  async createChooserTransaction(transaction: Transaction): Promise<Record<string, unknown>> {
    return this.createTransaction(transaction, {});
  }

  useChooser() {
    const { data, loading, error } = super.useDocument();
    return { chooser: data, loading, error };
  }

  useCurrentChooser() {
    const { chooser, loading, error } = this.useChooser();
    if (loading || error || !chooser) {
      return { currentChooserTeamId: null, loading, error };
    }
    const chooserOrder = chooser.chooserOrder as string[];
    const chooserIdx = chooser.chooserIdx as number;
    return { currentChooserTeamId: chooserOrder[chooserIdx], loading, error };
  }

  useIsChooser(teamId: string) {
    const { currentChooserTeamId, loading, error } = this.useCurrentChooser();
    if (loading || error) {
      return { isChooser: false, loading, error };
    }
    return { isChooser: teamId === currentChooserTeamId, loading, error };
  }
}
