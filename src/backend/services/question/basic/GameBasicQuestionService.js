import GameQuestionService from '@/backend/services/question/GameQuestionService';

import { QuestionType } from '@/backend/models/questions/QuestionType';
import { PlayerStatus } from '@/backend/models/users/Player';

import ChooserRepository from '@/backend/repositories/user/ChooserRepository';

import { runTransaction } from 'firebase/firestore';
import { firestore } from '@/backend/firebase/firebase';

export default class GameBasicQuestionService extends GameQuestionService {
  constructor(gameId, roundId) {
    super(gameId, roundId, QuestionType.BASIC);

    this.chooserRepo = new ChooserRepository(gameId);
  }

  async resetQuestionTransaction(transaction, questionId) {
    await this.gameQuestionRepo.resetQuestionTransaction(transaction, questionId);

    console.log(
      'Basic question successfully reset',
      'game',
      this.gameId,
      'round',
      this.roundId,
      'question',
      questionId
    );
  }

  async handleCountdownEndTransaction(transaction, questionId) {
    const teamId = await this.chooserRepo.getChooserIdTransaction(transaction);
    const choosers = await this.playerRepo.getPlayersByTeamIdTransaction(transaction, teamId);

    await this.roundScoreRepo.increaseTeamScoreTransaction(transaction, questionId, teamId, 0);
    await this.gameQuestionRepo.updateQuestionTransaction(transaction, questionId, {
      correct: false,
    });

    for (const c of choosers) {
      await this.playerRepo.updatePlayerStatusTransaction(transaction, c.id, PlayerStatus.READY);
    }

    await this.soundRepo.addWrongAnswerSoundToQueueTransaction(transaction);
    await this.endQuestionTransaction(transaction, questionId);

    console.log(
      'Basic question countdown end successfully handled',
      'game',
      this.gameId,
      'round',
      this.roundId,
      'question',
      questionId
    );
  }

  /* =============================================================================================================== */

  async handleAnswer(questionId, teamId, correct = false) {
    if (!questionId) {
      throw new Error('No question ID has been provided!');
    }
    if (!teamId) {
      throw new Error('No team ID has been provided!');
    }

    try {
      await runTransaction(firestore, async (transaction) => {
        const choosers = await this.playerRepo.getPlayersByTeamIdTransaction(transaction, teamId);
        const round = await this.roundRepo.getRoundTransaction(transaction, this.roundId);

        const reward = correct ? round.rewardsPerQuestion : 0;
        await this.roundScoreRepo.increaseTeamScoreTransaction(transaction, questionId, teamId, reward);
        await this.gameQuestionRepo.updateQuestionTransaction(transaction, questionId, {
          reward,
          correct,
        });

        for (const c of choosers) {
          await this.playerRepo.updatePlayerStatusTransaction(transaction, c.id, PlayerStatus.READY);
        }

        await this.soundRepo.addSoundTransaction(transaction, correct ? 'Anime wow' : 'hysterical5');
        await this.endQuestionTransaction(transaction, questionId);

        console.log(
          'Answer to basic question successfully handled',
          'game',
          this.gameId,
          'round',
          this.roundId,
          'question',
          questionId,
          'team',
          teamId,
          'correct',
          correct
        );
      });
    } catch (error) {
      console.error(
        'Failed to handle answer to basic question',
        'game',
        this.gameId,
        'round',
        this.roundId,
        'question',
        questionId,
        'team',
        teamId,
        'correct',
        correct
      );
      throw error;
    }
  }
}
