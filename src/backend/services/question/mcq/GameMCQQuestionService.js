import GameQuestionService from '@/backend/services/question/GameQuestionService';
import { MCQQuestion } from '@/backend/models/questions/MCQ';
import { QuestionType } from '@/backend/models/questions/QuestionType';
import { PlayerStatus } from '@/backend/models/users/Player';

import { runTransaction } from 'firebase/firestore';
import { firestore } from '@/backend/firebase/firebase';

export default class GameMCQQuestionService extends GameQuestionService {
  constructor(gameId, roundId) {
    super(gameId, roundId, QuestionType.MCQ);
  }

  async resetQuestionTransaction(transaction, questionId) {
    await this.gameQuestionRepo.resetQuestionTransaction(transaction, questionId);
    console.log('MCQ question successfully reset', 'game', this.gameId, 'round', this.roundId, 'question', questionId);
  }

  async endQuestionTransaction(transaction, questionId) {
    await super.endQuestionTransaction(transaction, questionId);
    console.log('MCQ question successfully ended', 'game', this.gameId, 'round', this.roundId, 'question', questionId);
  }

  async handleCountdownEndTransaction(transaction, questionId) {
    // await super.handleCountdownEndTransaction(transaction, questionId);
    const gameQuestion = await this.gameQuestionRepo.getQuestionTransaction(transaction, questionId);
    const teamId = await this.chooserRepo.getChooserIdTransaction(transaction);
    const playerId = gameQuestion.playerId;
    const choiceIdx = gameQuestion.choiceIdx;

    await this.playerRepo.updateTeamPlayersStatusTransaction(transaction, teamId, PlayerStatus.READY);

    const correct = false;
    const reward = 0;
    await this.roundScoreRepo.increaseTeamScoreTransaction(transaction, questionId, teamId, reward);
    await this.gameQuestionRepo.updateQuestionTransaction(transaction, questionId, {
      playerId,
      choiceIdx,
      reward,
      correct,
    });

    await this.soundRepo.addWrongAnswerSoundToQueueTransaction(transaction);
    await this.endQuestionTransaction(transaction, questionId);

    console.log(
      'MCQ question countdown end successfully handled',
      'game',
      this.gameId,
      'round',
      this.roundId,
      'question',
      questionId
    );
  }

  /* =============================================================================================================== */

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
        const baseQuestion = await this.baseQuestionRepo.getQuestionTransaction(transaction, questionId);
        const round = await this.roundRepo.getRoundTransaction(transaction, this.roundId);
        const answerIdx = baseQuestion.answerIdx;
        const correct = choiceIdx === answerIdx;
        const reward = correct ? round.rewardsPerQuestion : 0;

        await this.roundScoreRepo.increaseTeamScoreTransaction(transaction, questionId, teamId, reward);
        await this.playerRepo.updateTeamPlayersStatusTransaction(transaction, teamId, PlayerStatus.READY);
        await this.gameQuestionRepo.updateQuestionTransaction(transaction, questionId, {
          playerId,
          choiceIdx,
          reward,
          correct,
        });
        await this.soundRepo.addSoundTransaction(transaction, correct ? 'Anime wow' : 'hysterical5');
        await this.endQuestionTransaction(transaction, questionId);

        console.log(
          'MCQ choice selection successfully handled',
          'game',
          this.gameId,
          'round',
          this.roundId,
          'question',
          questionId,
          'player',
          playerId,
          'team',
          teamId,
          'choice',
          choiceIdx
        );
      });
    } catch (error) {
      console.error(
        'Failed to select the MCQ choice',
        'game',
        this.gameId,
        'round',
        this.roundId,
        'question',
        questionId,
        'player',
        playerId,
        'team',
        teamId,
        'choice',
        choiceIdx,
        'err',
        error
      );
      throw error;
    }
  }
}
