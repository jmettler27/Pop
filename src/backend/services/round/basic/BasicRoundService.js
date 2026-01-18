import GameBasicQuestionRepository from '@/backend/repositories/question/game/GameBasicQuestionRepository';
import BuzzerRoundService from '@/backend/services/round/BuzzerRoundService';

export default class BasicRoundService extends BuzzerRoundService {
  async calculateMaxPointsTransaction(transaction, round) {
    return round.questions.length * (round.rewardsPerQuestion + round.rewardsForBonus);
  }

  async prepareQuestionStartTransaction(transaction, questionId, questionOrder) {
    const gameQuestion = await this.gameQuestionRepo.getQuestionTransaction(transaction, questionId);
    const playerIds = await this.playerRepo.getAllIdsTransaction(transaction);

    for (const id of playerIds) {
      await this.playerRepo.updatePlayerStatusTransaction(transaction, id, PlayerStatus.IDLE);
    }

    await this.timerRepo.resetTimerTransaction(transaction, gameQuestion.thinkingTime);
    await this.soundRepo.addSoundTransaction(transaction, 'super_mario_odyssey_moon');

    // const gameQuestionRepo = new GameBasicQuestionRepository(this.gameId, this.roundId)
    // await gameQuestionRepo.startQuestionTransaction(transaction, questionId)
  }
}
