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

  async resetQuestion(questionId) {
    try {
      await runTransaction(firestore, async (transaction) => {
        // await super.resetQuestionTransaction(transaction, questionId);
        await this.gameQuestionRepo.updateQuestionTransaction(transaction, questionId, {
          teamId: null,
          correct: null,
        });
        console.log('Reset basic question', questionId);
      });
      console.log('Successfully reset basic question', questionId);
    } catch (error) {
      console.error('There was an error resetting basic question', error);
      throw error;
    }
  }

  async handleCountdownEnd(questionId) {
    try {
      await runTransaction(firestore, async (transaction) => {
        const teamId = await this.chooserRepo.getChooserIdTransaction(transaction);
        const choosers = await this.playerRepo.getPlayersByTeamIdTransaction(transaction, teamId);

        await this.roundScoreRepo.increaseTeamScoreTransaction(transaction, questionId, teamId, 0);
        await this.gameQuestionRepo.updateQuestionTransaction(transaction, questionId, {
          correct: false,
        });

        for (const chooser of choosers) {
          await this.playerRepo.updatePlayerStatusTransaction(transaction, chooser.id, PlayerStatus.READY);
        }

        await this.soundRepo.addWrongAnswerSoundToQueueTransaction(transaction);
        await this.endQuestionTransaction(transaction, questionId);

        console.log('Handled countdown end to basic question', questionId);
      });
      console.log('Successfully handled countdown end to basic question', questionId);
    } catch (error) {
      console.error('There was an error handling countdown end to basic question', error);
      throw error;
    }
  }

  async endQuestion(questionId) {
    try {
      await runTransaction(firestore, async (transaction) => {
        await super.endQuestionTransaction(transaction, questionId);
        // await this.gameQuestionRepo.clearBuzzedPlayersTransaction(transaction, questionId);
        console.log('Ended basic question', questionId);
      });
      console.log('Successfully ended basic question', questionId);
    } catch (error) {
      console.error('There was an error ending basic question', error);
      throw error;
    }
  }

  /* ============================================================================================================ */

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
          playerId,
          choiceIdx,
          reward,
          correct,
        });

        for (const chooser of choosers) {
          await this.playerRepo.updatePlayerStatusTransaction(transaction, chooser.id, PlayerStatus.READY);
        }

        await this.soundRepo.addSoundTransaction(transaction, correct ? 'Anime wow' : 'hysterical5');
        await this.endQuestionTransaction(transaction, questionId);

        console.log('Successfully handled answer to basic question', questionId, teamId, correct);
      });
    } catch (error) {
      console.error('There was an error handling the answer to basic question', error);
      throw error;
    }
  }
}
