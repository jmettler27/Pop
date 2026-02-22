import BuzzerRoundService from '@/backend/services/round/BuzzerRoundService';
import { RoundType } from '@/backend/models/rounds/RoundType';

export default class BasicRoundService extends BuzzerRoundService {
  constructor(gameId) {
    super(gameId, RoundType.BASIC);
  }

  async prepareQuestionStartTransaction(transaction, questionId, questionOrder) {
    const gameQuestionRepo = new GameBasicQuestionRepository(this.gameId, this.roundId);

    const gameQuestion = await gameQuestionRepo.getQuestionTransaction(transaction, questionId);
    const playerIds = await this.playerRepo.getAllIdsTransaction(transaction);

    for (const id of playerIds) {
      await this.playerRepo.updatePlayerStatusTransaction(transaction, id, PlayerStatus.IDLE);
    }

    await this.timerRepo.resetTimerTransaction(transaction, gameQuestion.thinkingTime);
    await this.soundRepo.addSoundTransaction(transaction, 'super_mario_odyssey_moon');

    // await gameQuestionRepo.startQuestionTransaction(transaction, questionId)
  }
}
