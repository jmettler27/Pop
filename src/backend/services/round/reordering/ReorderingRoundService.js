import { PlayerStatus } from '@/backend/models/users/Player';

import RoundService from '@/backend/services/round/RoundService';
import GameOddOneOutQuestionRepository from '@/backend/repositories/question/game/GameOddOneOutQuestionRepository';
import { RoundType } from '@/backend/models/rounds/RoundType';

export default class ReorderingRoundService extends RoundService {
  constructor(gameId) {
    super(gameId, RoundType.REORDERING);
  }

  async calculateMaxPointsTransaction(transaction, round) {
    return round.questions.length * round.rewardsPerQuestion;
  }

  async prepareQuestionStartTransaction(transaction, questionId, questionOrder) {
    const gameQuestion = await this.gameQuestionRepo.getQuestionTransaction(transaction, questionId);

    const chooser = await this.chooserRepo.getChooserTransaction(transaction);
    const newChooserTeamId = chooser.chooserOrder[0];

    const choosers = await this.playerRepo.getPlayersByTeamIdTransaction(transaction, newChooserTeamId);
    const nonChoosers = await this.playerRepo.getAllOtherPlayersTransaction(transaction, newChooserTeamId);

    await this.chooserRepo.resetChoosersTransaction(transaction);

    for (const player of choosers) {
      await this.playerRepo.updatePlayerStatusTransaction(transaction, player.id, PlayerStatus.FOCUS);
    }
    for (const player of nonChoosers) {
      await this.playerRepo.updatePlayerStatusTransaction(transaction, player.id, PlayerStatus.IDLE);
    }

    await this.timerRepo.resetTimerTransaction(transaction, gameQuestion.thinkingTime);

    const gameQuestionRepo = new GameOddOneOutQuestionRepository(this.gameId, this.roundId);
    await gameQuestionRepo.startQuestionTransaction(transaction, questionId);
  }
}
