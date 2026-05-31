import { runTransaction, serverTimestamp, Transaction } from 'firebase/firestore';

import { firestore } from '@/backend/firebase/firebase';
import GameBuzzerQuestionRepository from '@/backend/repositories/question/GameBuzzerQuestionRepository';
import RoundRepository from '@/backend/repositories/round/RoundRepository';
import GameQuestionService from '@/backend/services/question/GameQuestionService';
import { GameStatus } from '@/models/games/game-status';
import { GameBuzzerQuestion } from '@/models/questions/buzzer';
import { QuestionType } from '@/models/questions/question-type';
import { BuzzerRound } from '@/models/rounds/buzzer';
import { TimerStatus } from '@/models/timer';
import { PlayerStatus } from '@/models/users/player';

export default class GameBuzzerQuestionService extends GameQuestionService {
  constructor(gameId: string, roundId: string, questionType: QuestionType) {
    super(gameId, roundId, questionType);
    this.roundRepo = new RoundRepository(gameId);
  }

  async resetQuestionTransaction(transaction: Transaction, questionId: string) {
    const gameQuestion = await (this.gameQuestionRepo as GameBuzzerQuestionRepository).getQuestionTransaction(
      transaction,
      questionId
    );
    if (!gameQuestion) {
      throw new Error('Game question not found');
    }

    await (this.gameQuestionRepo as GameBuzzerQuestionRepository).resetQuestionTransaction(transaction, questionId);
    await this.timerRepo.resetTimerTransaction(transaction, gameQuestion.thinkingTime);
  }

  async endQuestion(questionId: string) {
    if (!questionId) {
      throw new Error('Question ID is required');
    }
    try {
      await runTransaction(firestore, async (transaction) => {
        // Update game status
        await this.gameRepo.updateGameStatusTransaction(transaction, this.gameId, GameStatus.QUESTION_END);
        await (this.gameQuestionRepo as GameBuzzerQuestionRepository).updateTransaction(transaction, questionId, {
          dateEnd: serverTimestamp(),
        });
        await this.timerRepo.prepareTimerForReadyTransaction(transaction);

        console.log(
          'Buzzer question successfully reset',
          'game',
          this.gameId,
          'round',
          this.roundId,
          'question',
          questionId,
          'type',
          this.questionType
        );
      });
    } catch (error) {
      console.error(
        'Failed to end buzzer question',
        'game',
        this.gameId,
        'round',
        this.roundId,
        'question',
        questionId,
        'type',
        this.questionType,
        'err',
        error
      );
      throw error;
    }
  }

  async handleCountdownEndTransaction(transaction: Transaction, questionId: string) {
    const questionPlayers = await (this.gameQuestionRepo as GameBuzzerQuestionRepository).getPlayersTransaction(
      transaction,
      questionId
    );
    if (!questionPlayers) {
      console.error(
        'Question players not found',
        'game',
        this.gameId,
        'round',
        this.roundId,
        'question',
        questionId,
        'type',
        this.questionType
      );
      throw new Error('Question players not found');
    }
    const buzzed = questionPlayers.buzzed;
    const gameQuestion = (await (this.gameQuestionRepo as GameBuzzerQuestionRepository).getQuestionTransaction(
      transaction,
      questionId
    )) as GameBuzzerQuestion;
    const thinkingTime = gameQuestion.thinkingTime;

    if (buzzed.length === 0) {
      await this.timerRepo.resetTimerTransaction(transaction, thinkingTime);
    } else {
      await this.invalidateAnswerTransaction(transaction, questionId, buzzed[0]);

      // If there's a next player in the queue, start their countdown
      if (buzzed.length > 1) {
        const thinkingTime = gameQuestion.thinkingTime;
        await this.playerRepo.updatePlayerStatusTransaction(transaction, buzzed[1], PlayerStatus.FOCUS);
        await this.timerRepo.startTimerTransaction(transaction, thinkingTime);
      } else {
        await this.timerRepo.resetTimerTransaction(transaction, thinkingTime);
      }
    }
  }

  /* =============================================================================================================== */
  async handleBuzzerHeadChanged(questionId: string, playerId: string) {
    if (!questionId) {
      throw new Error('Question ID is required');
    }
    if (!playerId) {
      throw new Error('Player ID is required');
    }

    try {
      await runTransaction(firestore, async (transaction) => {
        const gameQuestion = (await (this.gameQuestionRepo as GameBuzzerQuestionRepository).getQuestionTransaction(
          transaction,
          questionId
        )) as GameBuzzerQuestion;
        const thinkingTime = gameQuestion.thinkingTime;

        await this.playerRepo.updatePlayerStatusTransaction(transaction, playerId, PlayerStatus.FOCUS);
        await this.timerRepo.startTimerTransaction(transaction, thinkingTime);

        console.log(
          'Buzzer head change successfully handled',
          'game',
          this.gameId,
          'round',
          this.roundId,
          'question',
          questionId,
          'type',
          this.questionType,
          'player',
          playerId
        );
      });
    } catch (error) {
      console.error(
        'Failed to handle buzzer head change',
        'game',
        this.gameId,
        'round',
        this.roundId,
        'question',
        questionId,
        'type',
        this.questionType,
        'err',
        error
      );
      throw error;
    }
  }

  async addPlayerToBuzzer(questionId: string, playerId: string) {
    if (!questionId) {
      throw new Error('Question ID is required');
    }
    if (!playerId) {
      throw new Error('Player ID is required');
    }

    try {
      await runTransaction(firestore, async (transaction) => {
        await (this.gameQuestionRepo as GameBuzzerQuestionRepository).addPlayerToBuzzerTransaction(
          transaction,
          questionId,
          playerId
        );
        await this.soundRepo.addSoundTransaction(transaction, 'sfx_menu_validate');

        console.log(
          'Player successfully added to buzzer',
          'game',
          this.gameId,
          'round',
          this.roundId,
          'question',
          questionId,
          'type',
          this.questionType,
          'player',
          playerId
        );
      });
    } catch (error) {
      console.error(
        'Failed to add player to buzzer',
        'game',
        this.gameId,
        'round',
        this.roundId,
        'question',
        questionId,
        'type',
        this.questionType,
        'player',
        playerId,
        'err',
        error
      );
      throw error;
    }
  }

  async removePlayerFromBuzzer(questionId: string, playerId: string) {
    if (!questionId) {
      throw new Error('Question ID is required');
    }
    if (!playerId) {
      throw new Error('Player ID is required');
    }

    try {
      await runTransaction(firestore, async (transaction) => {
        await (this.gameQuestionRepo as GameBuzzerQuestionRepository).removePlayerFromBuzzerTransaction(
          transaction,
          questionId,
          playerId
        );
        await this.playerRepo.updatePlayerStatusTransaction(transaction, playerId, PlayerStatus.IDLE);
        await this.soundRepo.addSoundTransaction(transaction, 'jpp_de_lair');

        console.log(
          'Player successfully removed from buzzer',
          'game',
          this.gameId,
          'round',
          this.roundId,
          'question',
          questionId,
          'type',
          this.questionType,
          'player',
          playerId
        );
      });
    } catch (error) {
      console.error(
        'Failed to remove player from buzzer',
        'game',
        this.gameId,
        'round',
        this.roundId,
        'question',
        questionId,
        'type',
        this.questionType,
        'player',
        playerId,
        'err',
        error
      );
      throw error;
    }
  }

  async clearBuzzer(questionId: string) {
    if (!questionId) {
      throw new Error('Question ID is required');
    }

    try {
      await runTransaction(firestore, async (transaction) => {
        const questionPlayers = await (this.gameQuestionRepo as GameBuzzerQuestionRepository).getPlayersTransaction(
          transaction,
          questionId
        );
        if (!questionPlayers) {
          console.error(
            'Question players not found',
            'game',
            this.gameId,
            'round',
            this.roundId,
            'question',
            questionId,
            'type',
            this.questionType
          );
          throw new Error('Question players not found');
        }

        const buzzed = questionPlayers.buzzed!;

        for (const playerId of buzzed) {
          await this.playerRepo.updatePlayerStatusTransaction(transaction, playerId, PlayerStatus.IDLE);
        }
        await (this.gameQuestionRepo as GameBuzzerQuestionRepository).clearBuzzedPlayersTransaction(
          transaction,
          questionId
        );
        await this.timerRepo.resetTimerTransaction(transaction);
        await this.soundRepo.addSoundTransaction(transaction, 'robinet_desert');

        console.log(
          'Buzzer cleared successfully',
          'game',
          this.gameId,
          'round',
          this.roundId,
          'question',
          questionId,
          'type',
          this.questionType
        );
      });
    } catch (error) {
      console.error(
        'Failed to clear buzzer',
        'game',
        this.gameId,
        'round',
        this.roundId,
        'question',
        questionId,
        'type',
        this.questionType,
        'err',
        error
      );

      throw error;
    }
  }

  async validateAnswer(questionId: string, playerId: string) {
    if (!questionId) {
      throw new Error('Question ID is required');
    }
    if (!playerId) {
      throw new Error('Player ID is required');
    }

    try {
      await runTransaction(firestore, (transaction: Transaction) =>
        this.validateAnswerTransaction(transaction, questionId, playerId)
      );
    } catch (error) {
      console.error(
        'Failed to validate answer to buzzer question',
        'game',
        this.gameId,
        'round',
        this.roundId,
        'question',
        questionId,
        'type',
        this.questionType,
        'player',
        playerId,
        'err',
        error
      );
      throw error;
    }
  }

  async validateAnswerTransaction(transaction: Transaction, questionId: string, playerId: string) {
    // Update the winner team scores
    const player = await this.playerRepo.getPlayerTransaction(transaction, playerId);
    const round = await this.roundRepo.getRoundTransaction(transaction, this.roundId);
    if (!player || !round) throw new Error('Player or round not found');

    const teamId = player.teamId;
    const points = (round as BuzzerRound).rewardsPerQuestion;

    await this.roundScoreRepo.increaseTeamScoreTransaction(transaction, questionId, teamId, points);
    await this.playerRepo.updatePlayerStatusTransaction(transaction, playerId, PlayerStatus.CORRECT);
    await (this.gameQuestionRepo as GameBuzzerQuestionRepository).updateQuestionWinnerTransaction(
      transaction,
      questionId,
      playerId,
      teamId
    );
    await this.soundRepo.addSoundTransaction(transaction, 'anime_wow');
    await this.endQuestionTransaction(transaction, questionId);

    console.log(
      'Answer to buzzer question successfully validated',
      'game',
      this.gameId,
      'round',
      this.roundId,
      'question',
      questionId,
      'type',
      this.questionType,
      'player',
      playerId
    );
  }

  async invalidateAnswer(questionId: string, playerId: string) {
    if (!questionId) {
      throw new Error('Question ID is required');
    }
    if (!playerId) {
      throw new Error('Player ID is required');
    }

    try {
      await runTransaction(firestore, (transaction: Transaction) =>
        this.invalidateAnswerTransaction(transaction, questionId, playerId)
      );
    } catch (error) {
      console.error(
        'Failed to invalidate answer to buzzer question',
        'game',
        this.gameId,
        'round',
        this.roundId,
        'question',
        questionId,
        'type',
        this.questionType,
        'player',
        playerId,
        'err',
        error
      );
      throw error;
    }
  }

  async invalidateAnswerTransaction(transaction: Transaction, questionId: string, playerId: string) {
    const gameQuestion = (await (this.gameQuestionRepo as GameBuzzerQuestionRepository).getQuestion(
      questionId
    )) as GameBuzzerQuestion;
    if (!gameQuestion) {
      console.error(
        'Game question not found',
        'game',
        this.gameId,
        'round',
        this.roundId,
        'question',
        questionId,
        'type',
        this.questionType
      );
      throw new Error('Game question not found');
    }

    const clueIdx = (gameQuestion as GameBuzzerQuestion & { currentClueIdx?: number }).currentClueIdx ?? 0;

    await (this.gameQuestionRepo as GameBuzzerQuestionRepository).cancelPlayerTransaction(
      transaction,
      questionId,
      playerId,
      clueIdx
    );
    await this.playerRepo.updatePlayerStatusTransaction(transaction, playerId, PlayerStatus.WRONG);
    await this.soundRepo.addWrongAnswerSoundToQueueTransaction(transaction);
    await this.timerRepo.updateTimerStatusTransaction(transaction, TimerStatus.RESET);

    console.log(
      'Answer to buzzer question successfully invalidated',
      'game',
      this.gameId,
      'round',
      this.roundId,
      'question',
      questionId,
      'type',
      this.questionType,
      'player',
      playerId
    );
  }
}
