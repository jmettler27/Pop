import { runTransaction, Transaction } from 'firebase/firestore';

import { firestore } from '@/backend/firebase/firebase';
import { logger } from '@/backend/logger';
import ChooserRepository from '@/backend/repositories/user/ChooserRepository';
import GameQuestionService from '@/backend/services/question/GameQuestionService';
import { GameMCQQuestion, MCQQuestion } from '@/models/questions/mcq';
import { QuestionType } from '@/models/questions/question-type';
import { MCQRound } from '@/models/rounds/mcq';
import { PlayerStatus } from '@/models/users/player';

export default class GameMCQQuestionService extends GameQuestionService {
  readonly chooserRepo: ChooserRepository;

  constructor(gameId: string, roundId: string) {
    super(gameId, roundId, QuestionType.MCQ);
    this.log = logger.child({ module: 'GameMCQQuestionService', game: gameId, round: roundId });
    this.chooserRepo = new ChooserRepository(gameId);
  }

  async resetQuestionTransaction(transaction: Transaction, questionId: string) {
    const gameQuestion = (await this.gameQuestionRepo.getQuestionTransaction(
      transaction,
      questionId
    )) as GameMCQQuestion;
    await this.gameQuestionRepo.resetQuestionTransaction(transaction, questionId);
    await this.timerRepo.resetTimerTransaction(transaction, gameQuestion.thinkingTime);
    this.log.info({ question: questionId }, 'MCQ question reset');
  }

  async endQuestionTransaction(transaction: Transaction, questionId: string) {
    await super.endQuestionTransaction(transaction, questionId);
    this.log.info({ question: questionId }, 'MCQ question ended');
  }

  async handleCountdownEndTransaction(transaction: Transaction, questionId: string) {
    // await super.handleCountdownEndTransaction(transaction, questionId);
    const gameQuestion = (await this.gameQuestionRepo.getQuestionTransaction(
      transaction,
      questionId
    )) as GameMCQQuestion;
    if (!gameQuestion) {
      this.log.warn({ question: questionId }, 'Game question not found');
      throw new Error('Game question not found');
    }

    const teamId = await this.chooserRepo.getChooserIdTransaction(transaction);
    if (!teamId) {
      this.log.warn({ question: questionId }, 'Chooser team not found');
      throw new Error('Chooser team not found');
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

    this.log.info({ question: questionId }, 'MCQ question countdown end handled');
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
        const baseQuestion = (await this.baseQuestionRepo.getQuestionTransaction(
          transaction,
          questionId
        )) as MCQQuestion;
        if (!baseQuestion) {
          this.log.warn({ question: questionId }, 'Base question not found');
          throw new Error('Base question not found');
        }

        const round = (await this.roundRepo.getRoundTransaction(transaction, this.roundId)) as MCQRound;
        if (!round) {
          this.log.warn({ question: questionId }, 'Round not found');
          throw new Error('Round not found');
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

        this.log.info(
          { question: questionId, player: playerId, team: teamId, choice: choiceIdx },
          'MCQ choice selected'
        );
      });
    } catch (error) {
      this.log.error(
        { question: questionId, player: playerId, team: teamId, choice: choiceIdx, err: error },
        'Failed to select the MCQ choice'
      );
      throw error;
    }
  }
}
