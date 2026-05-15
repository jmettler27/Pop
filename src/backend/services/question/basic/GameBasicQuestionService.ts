import { runTransaction, Transaction } from 'firebase/firestore';

import { firestore } from '@/backend/firebase/firebase';
import ChooserRepository from '@/backend/repositories/user/ChooserRepository';
import GameBuzzerQuestionService from '@/backend/services/question/GameBuzzerQuestionService';
import { QuestionType } from '@/models/questions/question-type';
import { BasicRound } from '@/models/rounds/basic';
import { PlayerStatus } from '@/models/users/player';

export default class GameBasicQuestionService extends GameBuzzerQuestionService {
  readonly chooserRepo: ChooserRepository;

  constructor(gameId: string, roundId: string) {
    super(gameId, roundId, QuestionType.BASIC);

    this.chooserRepo = new ChooserRepository(gameId);
  }

  async resetQuestionTransaction(transaction: Transaction, questionId: string) {
    const gameQuestion = await this.gameQuestionRepo.getQuestionTransaction(transaction, questionId);
    await this.gameQuestionRepo.resetQuestionTransaction(transaction, questionId);
    await this.timerRepo.resetTimerTransaction(transaction, gameQuestion.thinkingTime);

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

  async handleCountdownEndTransaction(transaction: Transaction, questionId: string) {
    const teamId = await this.chooserRepo.getChooserIdTransaction(transaction);
    if (!teamId) {
      console.log('No team is currently choosing, cannot handle countdown end');
      throw new Error('No team is currently choosing, cannot handle countdown end');
    }

    const choosers = await this.playerRepo.getPlayersByTeamIdTransaction(transaction, teamId);
    if (choosers.length === 0) {
      console.log('No choosers found for team, cannot handle countdown end');
      throw new Error('No choosers found for team, cannot handle countdown end');
    }

    await this.roundScoreRepo.increaseTeamScoreTransaction(transaction, questionId, teamId, 0);
    await this.gameQuestionRepo.updateQuestionTransaction(transaction, questionId, {
      correct: false,
    });

    for (const c of choosers) {
      await this.playerRepo.updatePlayerStatusTransaction(transaction, c.id!, PlayerStatus.READY);
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

  async handleAnswer(questionId: string, teamId: string, correct = false) {
    if (!questionId) {
      throw new Error('No question ID has been provided!');
    }
    if (!teamId) {
      throw new Error('No team ID has been provided!');
    }

    try {
      await runTransaction(firestore, async (transaction: Transaction) => {
        const choosers = await this.playerRepo.getPlayersByTeamIdTransaction(transaction, teamId);
        if (choosers.length === 0) {
          console.log('No choosers found for team, cannot handle answer');
          throw new Error('No choosers found for team, cannot handle answer');
        }

        const round = await this.roundRepo.getRoundTransaction(transaction, this.roundId);
        if (!round) {
          console.log('Round not found, cannot handle answer');
          throw new Error('Round not found, cannot handle answer');
        }

        const reward = correct ? (round as BasicRound).rewardsPerQuestion : 0;
        await this.roundScoreRepo.increaseTeamScoreTransaction(transaction, questionId, teamId, reward);
        await this.gameQuestionRepo.updateQuestionTransaction(transaction, questionId, {
          reward,
          correct,
        });

        for (const c of choosers) {
          await this.playerRepo.updatePlayerStatusTransaction(transaction, c.id!, PlayerStatus.READY);
        }

        await this.soundRepo.addSoundTransaction(transaction, correct ? 'anime_wow' : 'hysterical5');
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
