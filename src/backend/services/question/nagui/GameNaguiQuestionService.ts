import { runTransaction, Transaction } from 'firebase/firestore';

import { firestore } from '@/backend/firebase/firebase';
import ChooserRepository from '@/backend/repositories/user/ChooserRepository';
import GameQuestionService from '@/backend/services/question/GameQuestionService';
import { GameNaguiQuestion, NAGUI_OPTION_TO_SOUND, NaguiQuestion } from '@/models/questions/nagui';
import { QuestionType } from '@/models/questions/question-type';
import { NaguiRound } from '@/models/rounds/nagui';
import { PlayerStatus } from '@/models/users/player';

export default class GameNaguiQuestionService extends GameQuestionService {
  readonly chooserRepo: ChooserRepository;

  constructor(gameId: string, roundId: string) {
    super(gameId, roundId, QuestionType.NAGUI);

    this.chooserRepo = new ChooserRepository(gameId);
  }

  async resetQuestionTransaction(transaction: Transaction, questionId: string) {
    const gameQuestion = await this.gameQuestionRepo.getQuestionTransaction(transaction, questionId);
    await this.gameQuestionRepo.resetQuestionTransaction(transaction, questionId);
    await this.timerRepo.resetTimerTransaction(transaction, gameQuestion.thinkingTime);
    console.log(
      'Nagui question successfully reset',
      'game',
      this.gameId,
      'round',
      this.roundId,
      'question',
      questionId
    );
  }

  async endQuestionTransaction(transaction: Transaction, questionId: string) {
    await super.endQuestionTransaction(transaction, questionId);
    console.log(
      'Nagui question successfully ended',
      'game',
      this.gameId,
      'round',
      this.roundId,
      'question',
      questionId
    );
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
      'Nagui question countdown end successfully handled',
      'game',
      this.gameId,
      'round',
      this.roundId,
      'question',
      questionId
    );
  }

  /* =============================================================================================================== */

  async selectOption(questionId: string, playerId: string, optionIdx: number) {
    if (!questionId) {
      throw new Error('No question ID has been provided!');
    }
    if (!playerId) {
      throw new Error('No player ID has been provided!');
    }
    if (optionIdx < 0 || optionIdx >= 4) {
      throw new Error('Invalid option index!');
    }

    try {
      await runTransaction(firestore, async (transaction) => {
        const option = GameNaguiQuestion.NAGUI_OPTIONS[optionIdx];
        await this.gameQuestionRepo.updateQuestionTransaction(transaction, questionId, { playerId, option });
        await this.soundRepo.addSoundTransaction(transaction, NAGUI_OPTION_TO_SOUND[option]);
        console.log(
          'Nagui option successfully selected',
          'game',
          this.gameId,
          'round',
          this.roundId,
          'question',
          questionId,
          'player',
          playerId,
          'option',
          optionIdx
        );
      });
    } catch (error) {
      console.error(
        'Failed to select the Nagui option',
        'game',
        this.gameId,
        'round',
        this.roundId,
        'question',
        questionId,
        'player',
        playerId,
        'option',
        optionIdx,
        'err',
        error
      );
      throw error;
    }
  }

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
    if (choiceIdx < 0 || choiceIdx >= NaguiQuestion.MAX_CHOICES) {
      throw new Error('Invalid choice index!');
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
        const naguiRound = round as NaguiRound;

        const gameQuestion = await this.gameQuestionRepo.getQuestionTransaction(transaction, questionId);
        if (!gameQuestion) {
          console.log();
          throw new Error();
        }
        await this.playerRepo.updateTeamPlayersStatus(teamId, PlayerStatus.READY);

        const answerIdx = baseQuestion.answerIdx;
        const correct = choiceIdx === answerIdx;
        // const correct = baseQuestion.isValidAnswer(choiceIdx);
        const reward = correct ? naguiRound.rewardsPerQuestion[gameQuestion.option] : 0;

        await this.roundScoreRepo.increaseTeamScoreTransaction(transaction, questionId, teamId, reward);
        await this.gameQuestionRepo.updateQuestionTransaction(transaction, questionId, {
          playerId,
          choiceIdx,
          reward,
          correct,
        });
        await this.soundRepo.addSoundTransaction(transaction, correct ? 'anime_wow' : 'hysterical5');
        await this.endQuestionTransaction(transaction, questionId);
        console.log(
          'Nagui choice selection successfully handled',
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
        'Failed to select Nagui choice',
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

  async handleHideAnswer(questionId: string, playerId: string, teamId: string, correct: boolean) {
    if (!questionId) {
      throw new Error('No question ID has been provided!');
    }
    if (!playerId) {
      throw new Error('No player ID has been provided!');
    }
    if (!teamId) {
      throw new Error('No team ID has been provided!');
    }
    if (correct !== true && correct !== false) {
      throw new Error('Invalid correct value!');
    }

    try {
      await runTransaction(firestore, async (transaction) => {
        const round = await this.roundRepo.getRoundTransaction(transaction, this.roundId);
        if (!round) {
          console.log();
          throw new Error();
        }
        const naguiRound = round as NaguiRound;

        const gameQuestion = await this.gameQuestionRepo.getQuestionTransaction(transaction, questionId);
        if (!gameQuestion) {
          console.log();
          throw new Error();
        }

        const reward = correct ? naguiRound.rewardsPerQuestion[gameQuestion.option] : 0;

        await this.playerRepo.updateTeamPlayersStatus(teamId, PlayerStatus.READY);

        await this.roundScoreRepo.increaseTeamScoreTransaction(transaction, questionId, teamId, reward);
        await this.gameQuestionRepo.updateQuestionTransaction(transaction, questionId, { playerId, reward, correct });
        await this.soundRepo.addSoundTransaction(transaction, correct ? 'anime_wow' : 'hysterical5');
        await this.endQuestionTransaction(transaction, questionId);

        console.log(
          'Answer to hidden Nagui option successfully handled',
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
          'correct',
          correct
        );
      });
    } catch (error) {
      console.error(
        'Failed to handle answer to hidden Nagui option',
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
        'correct',
        correct,
        'err',
        error
      );
      throw error;
    }
  }
}
