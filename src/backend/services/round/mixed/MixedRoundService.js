import GameQuestionRepositoryFactory from '@/backend/repositories/question/game/GameQuestionRepositoryFactory';
import RoundService from '@/backend/services/round/RoundService';

export default class MixedRoundService extends RoundService {
  async calculateMaxPointsTransaction(transaction, round) {
    return round.questions.length * round.rewardsPerQuestion;
  }

  async prepareQuestionStartTransaction(transaction, questionId, questionOrder) {
    const baseQuestion = await this.baseQuestionRepo.getQuestionTransaction(transaction, questionId);
    const gameQuestion = await this.gameQuestionRepo.getQuestionTransaction(transaction, questionId);

    const chooser = await this.chooserRepo.getChooserTransaction(transaction);
    const { chooserOrder, chooserIdx } = chooser;

    if (baseQuestion.type === QuestionType.MCQ || baseQuestion.type === QuestionType.NAGUI) {
      const chooserTeamId = chooserOrder[chooserIdx];

      if (questionOrder > 0) {
        const newChoosers = await this.playerRepo.getPlayersByTeamIdTransaction(transaction, newChooserTeamId);
        const prevChoosers = await this.playerRepo.getPlayersByTeamIdTransaction(transaction, chooserTeamId);
        const newChooserIdx = getNextCyclicIndex(chooserIdx, chooserOrder.length);
        const newChooserTeamId = chooserOrder[newChooserIdx];
        await this.chooserRepo.updateChooserTransaction(transaction, {
          chooserIdx: newChooserIdx,
        });
        await this.gameQuestionRepo.updateQuestionTransaction(transaction, questionId, {
          teamId: newChooserTeamId,
        });
        for (const player of newChoosers) {
          await this.playerRepo.updatePlayerStatusTransaction(transaction, player.id, PlayerStatus.FOCUS);
        }
        for (const player of prevChoosers) {
          await this.playerRepo.updatePlayerStatusTransaction(transaction, player.id, PlayerStatus.IDLE);
        }
      } else {
        await this.gameQuestionRepo.updateQuestionTransaction(transaction, questionId, {
          teamId: chooserTeamId,
        });
      }
      await this.timerRepo.resetTimerTransaction(transaction, gameQuestion.thinkingTime);
    } else if (baseQuestion.type === QuestionType.ODD_ONE_OUT || baseQuestion.type === QuestionType.MATCHING) {
      const newChooserIdx = 0;
      const newChooserTeamId = chooserOrder[newChooserIdx];

      const choosers = await this.playerRepo.getPlayersByTeamIdTransaction(transaction, newChooserTeamId);
      const nonChoosers = await this.playerRepo.getAllOtherPlayersTransaction(transaction, newChooserTeamId);

      await this.chooserRepo.updateChooserTransaction(transaction, {
        chooserIdx: newChooserIdx,
      });
      for (const player of choosers) {
        await this.playerRepo.updatePlayerStatusTransaction(transaction, player.id, PlayerStatus.FOCUS);
      }
      for (const player of nonChoosers) {
        await this.playerRepo.updatePlayerStatusTransaction(transaction, player.id, PlayerStatus.IDLE);
      }
      if (baseQuestion.type === QuestionType.MATCHING) {
        await this.timerRepo.resetTimerTransaction(transaction, gameQuestion.thinkingTime * (baseQuestion.numCols - 1));
      } else {
        await this.timerRepo.resetTimerTransaction(transaction, gameQuestion.thinkingTime);
      }
    } else {
      const playerIds = await this.playerRepo.getAllIdsTransaction(transaction);

      for (const id of playerIds) {
        await this.playerRepo.updatePlayerStatusTransaction(transaction, id, PlayerStatus.IDLE);
      }
      if (baseQuestion.type === QuestionType.ENUMERATION) {
        await this.timerRepo.resetTimerTransaction(transaction, baseQuestion.thinkingTime);
      } else {
        await this.timerRepo.resetTimerTransaction(transaction, gameQuestion.thinkingTime);
      }
    }

    if (baseQuestion.type !== QuestionType.BLINDTEST) {
      await this.soundRepo.addSoundTransaction(transaction, 'super_mario_odyssey_moon');
    }

    const gameQuestionRepo = GameQuestionRepositoryFactory.createRepository(
      baseQuestion.type,
      this.gameId,
      this.roundId
    );
    await gameQuestionRepo.startQuestionTransaction(transaction, questionId);
  }
}
