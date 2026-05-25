import { Transaction } from 'firebase/firestore';

import RoundService from '@/backend/services/round/RoundService';
import { RoundType } from '@/models/rounds/round-type';
import { AnyRound } from '@/models/rounds/RoundFactory';

export default class MixedRoundService extends RoundService {
  constructor(gameId: string) {
    super(gameId, RoundType.MIXED);
  }

  async calculateMaxPointsTransaction(transaction: Transaction, round: AnyRound): Promise<number> {
    return 0;
  }
}
