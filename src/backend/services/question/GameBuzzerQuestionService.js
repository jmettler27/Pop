import { GameStatus } from '@/backend/models/games/GameStatus';

import { firestore } from '@/backend/firebase/firebase';
import { arrayRemove, arrayUnion, runTransaction, serverTimestamp, Timestamp } from 'firebase/firestore';
import { PlayerStatus } from '@/backend/models/users/Player';
import RoundRepository from '@/backend/repositories/round/RoundRepository';
import { TimerStatus } from '@/backend/models/Timer';
import GameQuestionService from '@/backend/services/question/GameQuestionService';

export default class GameBuzzerQuestionService extends GameQuestionService {
  constructor(gameId, roundId, questionType) {
    super(gameId, roundId, questionType);
    this.roundRepo = new RoundRepository(gameId);
  }

  async resetQuestion(questionId) {
    if (!questionId) {
      throw new Error('Question ID is required');
    }
    try {
      await runTransaction(firestore, async (transaction) => this.resetQuestionTransaction(transaction, questionId));
    } catch (error) {
      console.error('There was an error resetting the question', error);
      throw error;
    }
  }

  async resetQuestionTransaction(transaction, questionId) {
    await this.gameQuestionRepo.resetPlayersTransaction(transaction, questionId);
    await this.gameQuestionRepo.resetQuestionWinnerTransaction(transaction, questionId);
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
      });
    } catch (error) {
      console.error('There was an error ending the question', error);
      throw error;
    }
  }

  async handleCountdownEnd(questionId) {
    if (!questionId) {
      throw new Error('Question ID is required');
    }

    try {
      await runTransaction(firestore, (transaction) => this.handleCountdownEndTransaction(transaction, questionId));
    } catch (error) {
      console.error('There was an error handling the countdown end', error);
      throw error;
    }
  }

  async handleCountdownEndTransaction(transaction, questionId) {
    // throw new Error("Not implemented");

    const players = await this.gameQuestionRepo.getPlayersTransaction(transaction);
    const { buzzed, canceled } = players;

    if (buzzed.length === 0) await this.timerRepo.prepareTimerForReadyTransaction(transaction);
    // await updateTimerStateTransaction(transaction, gameId, 'reset')
    else await invalidateBuzzerAnswerTransaction(transaction, gameId, roundId, questionId, buzzed[0], questionType);
  }

  /* ============================================================================================================ */
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
        // await updateTimerStateTransaction(transaction, gameId, 'start')
        await this.timerRepo.updateTimerStatusTransaction(transaction, TimerStatus.START);
      });
    } catch (error) {
      console.error('There was an error handling the buzzer head change', error);
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
      });
    } catch (error) {
      console.error('There was an error adding the player to the buzzer', error);
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
        //     await this.timerRepo.updateTimerStatusTransaction(transaction, TimerStatus.RESET);
        // }
      });
    } catch (error) {
      console.error('There was an error removing the player from the buzzer', error);
      throw error;
    }
  }

  async clearBuzzer(questionId) {
    if (!questionId) {
      throw new Error('Question ID is required');
    }

    try {
      await runTransaction(firestore, async (transaction) => {
        const players = await this.gameQuestionRepo.getPlayersTransaction(transaction, questionId);
        const { buzzed } = players;

        for (const playerId of buzzed) {
          await this.playerRepo.updatePlayerStatusTransaction(transaction, playerId, PlayerStatus.IDLE);
        }
        await this.gameQuestionRepo.clearBuzzedPlayersTransaction(transaction, questionId);
        await this.timerRepo.updateTimerStatusTransaction(transaction, TimerStatus.RESET);
        await this.soundRepo.addSoundTransaction(transaction, 'robinet_desert');
      });
    } catch (error) {
      console.error('There was an error clearing the buzzer', error);
      throw error;
    }
  }

  async validateAnswer(questionId, playerId, wholeTeam = false) {
    if (!questionId) {
      throw new Error('Question ID is required');
    }
    if (!playerId) {
      throw new Error('Player ID is required');
    }

    try {
      await runTransaction(firestore, (transaction) =>
        this.validateAnswerTransaction(transaction, questionId, playerId, wholeTeam)
      );
    } catch (error) {
      console.error('There was an error validating the answer', error);
      throw error;
    }
  }

  async validateAnswerTransaction(transaction, questionId, playerId, wholeTeam) {
    // Update the winner team scores
    const player = await this.playerRepo.getPlayerTransaction(transaction);
    const round = await this.roundRepo.getRoundTransaction(transaction, this.roundId);

    const teamId = player.teamId;
    const points = round.rewardsPerQuestion;

    await this.roundScoreRepo.increaseTeamScoreTransaction(transaction, questionId, teamId, points);

    // Update the winner player status
    await this.playerRepo.updatePlayerStatusTransaction(transaction, questionId, PlayerStatus.CORRECT);

    // Update the question winner team
    await this.gameQuestionRepo.updateQuestionWinnerTransaction(transaction, questionId, playerId, teamId);
    await this.soundRepo.addSoundTransaction(transaction, 'Anime_wow');
    await this.endQuestionTransaction(transaction, questionId);
  }

  async invalidateAnswer(questionId, playerId, wholeTeam = false) {
    if (!questionId) {
      throw new Error('Question ID is required');
    }
    if (!playerId) {
      throw new Error('Player ID is required');
    }

    try {
      await runTransaction(firestore, (transaction) =>
        this.invalidateAnswerTransaction(transaction, questionId, playerId, wholeTeam)
      );
    } catch (error) {
      console.error('There was an error invalidating the answer', error);
      throw error;
    }
  }

  async invalidateAnswerTransaction(transaction, questionId, playerId, wholeTeam) {
    const gameQuestion = await this.gameQuestionRepo.getQuestion(questionId);
    const clueIdx = gameQuestion.currentClueIdx || 0;

    await this.gameQuestionRepo.updatePlayersTransaction(transaction, questionId, {
      canceled: arrayUnion({
        clueIdx,
        playerId,
        timestamp: Timestamp.now(),
      }),
      buzzed: arrayRemove(playerId),
    });

    await this.playerRepo.updatePlayerStatusTransaction(transaction, playerId, PlayerStatus.WRONG);
    await this.soundRepo.addWrongAnswerSoundToQueueTransaction(transaction);
    // await this.timerRepo.updateTimerStatusTransaction(transaction, TimerStatus.RESET)

    // } else {
    //     /* Penalize only the player */
    //     // Remove the player from the buzzed list
    //     await removeBuzzedPlayer(gameId, roundId, questionId, playerId)
    //     updatePlayerStatus(gameId, playerId, 'wrong')
    // }
  }

  // async updateQuestionWinner(questionId, playerId, teamId) {
  //     if (!questionId) {
  //         throw new Error("Question ID is required");
  //     }
  //     if (!playerId) {
  //         throw new Error("Player ID is required");
  //     }
  //     if (!teamId) {
  //         throw new Error("Team ID is required");
  //     }
  //
  //     try {
  //         await runTransaction(firestore, transaction => this.updateQuestionWinnerTransaction(transaction, questionId, playerId, teamId));
  //     }
  //     catch (error) {
  //         console.error("There was an error updating the question winner", error);
  //         throw error;
  //     }
  // }

  // async updateQuestionWinnerTransaction(transaction, questionId, playerId, teamId) {
  //     await this.gameQuestionRepo.updateTransaction(transaction, questionId, {
  //         winner: {
  //             playerId,
  //             teamId
  //         }
  //     });
  // }
}
