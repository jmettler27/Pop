import { GameStatus } from '@/backend/models/games/GameStatus';

import { firestore } from '@/backend/firebase/firebase';
import { runTransaction, serverTimestamp } from 'firebase/firestore';
import { PlayerStatus } from '@/backend/models/users/Player';
import RoundRepository from '@/backend/repositories/round/RoundRepository';
import { TimerStatus } from '@/backend/models/Timer';
import GameQuestionService from '@/backend/services/question/GameQuestionService';

export default class GameBuzzerQuestionService extends GameQuestionService {
  constructor(gameId, roundId, questionType) {
    super(gameId, roundId, questionType);
    this.roundRepo = new RoundRepository(gameId);
  }

  async resetQuestionTransaction(transaction, questionId) {
    await this.gameQuestionRepo.resetQuestionTransaction(transaction, questionId);
  }

  async endQuestion(questionId) {
    if (!questionId) {
      throw new Error('Question ID is required');
    }
    try {
      await runTransaction(firestore, async (transaction) => {
        // Update game status
        await this.gameRepo.updateGameStatusTransaction(transaction, this.gameId, GameStatus.QUESTION_END);
        await this.gameQuestionRepo.updateTransaction(transaction, questionId, {
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

  async handleCountdownEndTransaction(transaction, questionId) {
    const questionPlayers = await this.gameQuestionRepo.getPlayersTransaction(transaction, questionId);
    const { buzzed } = questionPlayers;

    if (buzzed.length === 0) {
      await this.timerRepo.resetTimerTransaction(transaction);
      // await this.timerRepo.prepareTimerForReadyTransaction(transaction);
    } else {
      await this.invalidateAnswerTransaction(transaction, questionId, buzzed[0]);
    }
  }

  /* =============================================================================================================== */
  async handleBuzzerHeadChanged(questionId, playerId) {
    if (!questionId) {
      throw new Error('Question ID is required');
    }
    if (!playerId) {
      throw new Error('Player ID is required');
    }

    try {
      await runTransaction(firestore, async (transaction) => {
        await this.playerRepo.updatePlayerStatusTransaction(transaction, playerId, PlayerStatus.FOCUS);
        // await this.timerRepo.updateTimerStatusTransaction(transaction, TimerStatus.START);

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

  async addPlayerToBuzzer(questionId, playerId) {
    if (!questionId) {
      throw new Error('Question ID is required');
    }
    if (!playerId) {
      throw new Error('Player ID is required');
    }

    try {
      await runTransaction(firestore, async (transaction) => {
        await this.gameQuestionRepo.addPlayerToBuzzerTransaction(transaction, questionId, playerId);
        await this.soundRepo.addSoundTransaction(transaction, 'sfx-menu-validate');

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

  async removePlayerFromBuzzer(questionId, playerId) {
    if (!questionId) {
      throw new Error('Question ID is required');
    }
    if (!playerId) {
      throw new Error('Player ID is required');
    }

    try {
      await runTransaction(firestore, async (transaction) => {
        await this.gameQuestionRepo.removePlayerFromBuzzerTransaction(transaction, questionId, playerId);
        await this.playerRepo.updatePlayerStatusTransaction(transaction, playerId, PlayerStatus.IDLE);
        await this.soundRepo.addSoundTransaction(transaction, 'JPP_de_lair');
        // const players = await this.gameQuestionRepo.getPlayersTransaction(transaction, questionId);
        // const { buzzed } = players;
        // if (buzzed[0] === playerId) {
        //     await this.timerRepo.resetTimerTransaction(transaction);
        // }
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

  async clearBuzzer(questionId) {
    if (!questionId) {
      throw new Error('Question ID is required');
    }

    try {
      await runTransaction(firestore, async (transaction) => {
        const questionPlayers = await this.gameQuestionRepo.getPlayersTransaction(transaction, questionId);
        const { buzzed } = questionPlayers;

        for (const playerId of buzzed) {
          await this.playerRepo.updatePlayerStatusTransaction(transaction, playerId, PlayerStatus.IDLE);
        }
        await this.gameQuestionRepo.clearBuzzedPlayersTransaction(transaction, questionId);
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

  async validateAnswer(questionId, playerId) {
    if (!questionId) {
      throw new Error('Question ID is required');
    }
    if (!playerId) {
      throw new Error('Player ID is required');
    }

    try {
      await runTransaction(firestore, (transaction) =>
        this.validateAnswerTransaction(transaction, questionId, playerId)
      );
    } catch (error) {
      console.log(
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

  async validateAnswerTransaction(transaction, questionId, playerId) {
    // Update the winner team scores
    const player = await this.playerRepo.getPlayerTransaction(transaction, playerId);
    const round = await this.roundRepo.getRoundTransaction(transaction, this.roundId);

    const teamId = player.teamId;
    const points = round.rewardsPerQuestion;

    await this.roundScoreRepo.increaseTeamScoreTransaction(transaction, questionId, teamId, points);

    // Update the winner player status
    await this.playerRepo.updatePlayerStatusTransaction(transaction, playerId, PlayerStatus.CORRECT);

    // Update the question winner team
    await this.gameQuestionRepo.updateQuestionWinnerTransaction(transaction, questionId, playerId, teamId);
    await this.soundRepo.addSoundTransaction(transaction, 'Anime wow');

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

  async invalidateAnswer(questionId, playerId) {
    if (!questionId) {
      throw new Error('Question ID is required');
    }
    if (!playerId) {
      throw new Error('Player ID is required');
    }

    try {
      await runTransaction(firestore, (transaction) =>
        this.invalidateAnswerTransaction(transaction, questionId, playerId)
      );
    } catch (error) {
      console.log(
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

  async invalidateAnswerTransaction(transaction, questionId, playerId) {
    const gameQuestion = await this.gameQuestionRepo.getQuestion(questionId);
    const clueIdx = gameQuestion.currentClueIdx || 0;

    await this.gameQuestionRepo.cancelPlayerTransaction(transaction, questionId, playerId, clueIdx);
    await this.playerRepo.updatePlayerStatusTransaction(transaction, playerId, PlayerStatus.WRONG);
    await this.soundRepo.addWrongAnswerSoundToQueueTransaction(transaction);
    // await this.timerRepo.updateTimerStatusTransaction(transaction, TimerStatus.RESET)

    // } else {
    //     /* Penalize only the player */
    //     // Remove the player from the buzzed list
    //     await removeBuzzedPlayer(gameId, roundId, questionId, playerId)
    //     updatePlayerStatus(gameId, playerId, 'wrong')
    // }

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
