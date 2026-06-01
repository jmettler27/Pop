import { runTransaction, Transaction } from 'firebase/firestore';

import { firestore } from '@/backend/firebase/firebase';
import { logger } from '@/backend/logger';
import ChooserRepository from '@/backend/repositories/user/ChooserRepository';
import GameBuzzerQuestionService from '@/backend/services/question/GameBuzzerQuestionService';
import { GameBasicQuestion } from '@/models/questions/basic';
import { QuestionType } from '@/models/questions/question-type';
import { BasicRound } from '@/models/rounds/basic';
import { PlayerStatus } from '@/models/users/player';

export default class GameBasicQuestionService extends GameBuzzerQuestionService {
  readonly chooserRepo: ChooserRepository;

  constructor(gameId: string, roundId: string) {
    super(gameId, roundId, QuestionType.BASIC);
    this.log = logger.child({ module: 'GameBasicQuestionService', game: gameId, round: roundId });
    this.chooserRepo = new ChooserRepository(gameId);
  }

  async resetQuestionTransaction(transaction: Transaction, questionId: string) {
    const gameQuestion = (await this.gameQuestionRepo.getQuestionTransaction(
      transaction,
      questionId
    )) as GameBasicQuestion;
    await this.gameQuestionRepo.resetQuestionTransaction(transaction, questionId);
    await this.timerRepo.resetTimerTransaction(transaction, gameQuestion.thinkingTime);

    this.log.info({ question: questionId }, 'Basic question reset');
  }

  async handleCountdownEndTransaction(transaction: Transaction, questionId: string) {
    const teamId = await this.chooserRepo.getChooserIdTransaction(transaction);
    if (!teamId) {
      this.log.warn({ question: questionId }, 'No team is currently choosing, cannot handle countdown end');
      throw new Error('No team is currently choosing, cannot handle countdown end');
    }

    const choosers = await this.playerRepo.getPlayersByTeamIdTransaction(transaction, teamId);
    if (choosers.length === 0) {
      this.log.warn({ question: questionId }, 'No choosers found for team, cannot handle countdown end');
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

    this.log.info({ question: questionId }, 'Basic question countdown end handled');
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
          this.log.warn({ question: questionId, team: teamId }, 'No choosers found for team, cannot handle answer');
          throw new Error('No choosers found for team, cannot handle answer');
        }

        const round = await this.roundRepo.getRoundTransaction(transaction, this.roundId);
        if (!round) {
          this.log.warn({ question: questionId }, 'Round not found, cannot handle answer');
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

        this.log.info({ question: questionId, team: teamId, correct }, 'Answer to basic question handled');
      });
    } catch (error) {
      this.log.error(
        { question: questionId, team: teamId, correct, err: error },
        'Failed to handle answer to basic question'
      );
      throw error;
    }
  }
}
