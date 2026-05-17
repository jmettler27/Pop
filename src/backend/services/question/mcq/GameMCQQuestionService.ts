import { runTransaction, Transaction } from 'firebase/firestore';

import { firestore } from '@/backend/firebase/firebase';
import ChooserRepository from '@/backend/repositories/user/ChooserRepository';
import GameQuestionService from '@/backend/services/question/GameQuestionService';
import { MCQQuestion } from '@/models/questions/mcq';
import { QuestionType } from '@/models/questions/question-type';
import { MCQRound } from '@/models/rounds/mcq';
import { PlayerStatus } from '@/models/users/player';

export default class GameMCQQuestionService extends GameQuestionService {
  readonly chooserRepo: ChooserRepository;

  constructor(gameId: string, roundId: string) {
    super(gameId, roundId, QuestionType.MCQ);

    this.chooserRepo = new ChooserRepository(gameId);
  }

  async resetQuestionTransaction(transaction: Transaction, questionId: string) {
    const gameQuestion = await this.gameQuestionRepo.getQuestionTransaction(transaction, questionId);
    await this.gameQuestionRepo.resetQuestionTransaction(transaction, questionId);
    await this.timerRepo.resetTimerTransaction(transaction, gameQuestion.thinkingTime);
    console.log('MCQ question successfully reset', 'game', this.gameId, 'round', this.roundId, 'question', questionId);
  }

  async endQuestionTransaction(transaction: Transaction, questionId: string) {
    await super.endQuestionTransaction(transaction, questionId);
    console.log('MCQ question successfully ended', 'game', this.gameId, 'round', this.roundId, 'question', questionId);
  }

  async handleCountdownEndTransaction(transaction: Transaction, questionId: string) {
    // await super.handleCountdownEndTransaction(transaction, questionId);
    const gameQuestion = await this.gameQuestionRepo.getQuestionTransaction(transaction, questionId);
    if (!gameQuestion) {
      console.log();
      throw new Error();
    }

    const teamId = await this.chooserRepo.getChooserIdTransaction(transaction);
    if (!teamId) {
      console.log();
      throw new Error();
    }
    const playerId = gameQuestion.playerId;
    const choiceIdx = gameQuestion.choiceIdx;

    await this.playerRepo.updateTeamPlayersStatus(teamId, PlayerStatus.READY);

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

  async selectChoice(questionId: string, playerId: string, teamId: string, choiceIdx: number) {
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
        if (!baseQuestion) {
          console.log();
          throw new Error();
        }

        const round = await this.roundRepo.getRoundTransaction(transaction, this.roundId);
        if (!round) {
          console.log();
          throw new Error();
        }
        const mcqRound = round as MCQRound;

        const answerIdx = baseQuestion.answerIdx;
        const correct = choiceIdx === answerIdx;
        const reward = correct ? mcqRound.rewardsPerQuestion : 0;

        await this.roundScoreRepo.increaseTeamScoreTransaction(transaction, questionId, teamId, reward);
        await this.playerRepo.updateTeamPlayersStatus(teamId, PlayerStatus.READY);
        await this.gameQuestionRepo.updateQuestionTransaction(transaction, questionId, {
          playerId,
          choiceIdx,
          reward,
          correct,
        });
        await this.soundRepo.addSoundTransaction(transaction, correct ? 'anime_wow' : 'hysterical5');
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
