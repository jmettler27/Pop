import GameQuestionService from '@/backend/services/question/GameQuestionService';
import { MCQQuestion } from '@/backend/models/questions/MCQ';
import { QuestionType } from '@/backend/models/questions/QuestionType';
import { PlayerStatus } from '@/backend/models/users/Player';

import { runTransaction } from 'firebase/firestore';

export default class GameMCQQuestionService extends GameQuestionService {
  constructor(gameId, roundId) {
    super(gameId, roundId, QuestionType.MCQ);
  }

  async resetQuestionTransaction(transaction, questionId) {
    await this.gameQuestionRepo.resetPlayersTransaction(transaction, questionId);
    await this.gameQuestionRepo.updateQuestionWinnerTransaction(transaction, questionId, null);

    await super.resetQuestionTransaction(transaction, questionId);
  }

  async endQuestionTransaction(transaction, questionId) {
    await super.endQuestionTransaction(transaction, questionId);
  }

  async handleCountdownEndTransaction(transaction, questionId) {
    await super.handleCountdownEndTransaction(transaction, questionId);

    const teamId = await this.chooserRepo.getChooserIdTransaction(transaction);
    const choosers = await this.playerRepo.getPlayersByTeamIdTransaction(transaction, teamId);

    const correct = false;
    const reward = 0;
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

    await this.soundRepo.addWrongAnswerSoundToQueueTransaction(transaction, gameId);
    await this.endQuestionTransaction(transaction, questionId);
  }

  /* ============================================================================================================ */

  async selectChoice(questionId, playerId, teamId, choiceIdx) {
    if (!questionId) {
      throw new Error('No question ID has been provided!');
    }
    if (!playerId) {
      throw new Error('No player ID has been provided!');
    }
    if (!teamId) {
      throw new Error('No team ID has been provided!');
    }
    if (choiceIdx < 0 || choiceIdx >= MCQQuestion.CHOICES.length) {
      throw new Error('Invalid choice!');
    }

    try {
      await runTransaction(firestore, async (transaction) => {
        const choosers = await this.playerRepo.getPlayersByTeamIdTransaction(transaction, teamId);
        const baseQuestion = await this.baseQuestionRepo.getQuestionTransaction(transaction, questionId);
        const round = await this.roundRepo.getRoundTransaction(transaction, this.roundId);

        const correct = choiceIdx === baseQuestion.answerIdx;
        const reward = correct ? round.rewardsPerQuestion : 0;
        await this.roundScoreRepo.increaseTeamScoreTransaction(transaction, questionId, teamId, reward);

        for (const chooser of choosers) {
          await this.playerRepo.updatePlayerStatusTransaction(transaction, chooser.id, PlayerStatus.READY);
        }

        await this.gameQuestionRepo.updateQuestionTransaction(transaction, questionId, {
          playerId,
          choiceIdx,
          reward,
          correct,
        });

        await this.soundRepo.addSoundTransaction(transaction, correct ? 'Anime wow' : 'hysterical5');
        await this.endQuestionTransaction(transaction, questionId);

        console.log('MCQ choice handled successfully!', questionId, playerId, teamId, choiceIdx);
      });
    } catch (error) {
      console.error('There was an error handling the MCQ choice:', error);
      throw error;
    }
  }
}
