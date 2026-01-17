import { GameStatus } from '@/backend/models/games/GameStatus';

import GameRepository from '@/backend/repositories/game/GameRepository';
import PlayerRepository from '@/backend/repositories/user/PlayerRepository';
import TimerRepository from '@/backend/repositories/timer/TimerRepository';
import GameQuestionRepositoryFactory from '@/backend/repositories/question/game/GameQuestionRepositoryFactory';
import BaseQuestionRepositoryFactory from '@/backend/repositories/question/base/BaseQuestionRepositoryFactory';
import SoundRepository from '@/backend/repositories/sound/SoundRepository';
import RoundScoreRepository from '@/backend/repositories/score/RoundScoreRepository';

import { firestore } from '@/backend/firebase/firebase';
import { runTransaction, serverTimestamp } from 'firebase/firestore';
import GameScoreRepository from '@/backend/repositories/score/GameScoreRepository';

export default class GameQuestionService {
  constructor(gameId, roundId, questionType) {
    if (!gameId) {
      throw new Error('Game ID is required');
    }
    if (!roundId) {
      throw new Error('Round ID is required');
    }
    if (!questionType) {
      throw new Error('Question type is required');
    }

    this.gameId = gameId;
    this.gameRepo = new GameRepository();
    this.playerRepo = new PlayerRepository(this.gameId);
    this.timerRepo = new TimerRepository(this.gameId);
    this.soundRepo = new SoundRepository(this.gameId);
    this.gameScoreRepo = new GameScoreRepository(this.gameId);

    this.questionType = questionType;
    this.baseQuestionRepo = BaseQuestionRepositoryFactory.createRepository(this.questionType);

    this.roundId = roundId;
    this.gameQuestionRepo = GameQuestionRepositoryFactory.createRepository(
      this.questionType,
      this.gameId,
      this.roundId
    );

    this.roundScoreRepo = new RoundScoreRepository(this.gameId, this.roundId);
  }

  async resetQuestion(questionId) {
    if (!questionId) {
      throw new Error('Question ID is required');
    }

    try {
      await runTransaction(firestore, (transaction) => this.resetQuestionTransaction(transaction, questionId));
    } catch (error) {
      console.error('There was an error resetting the question', error);
      throw error;
    }
  }

  async resetQuestionTransaction(transaction, questionId) {
    // this.gameQuestionRepo.updateTransaction(transaction, questionId, {
    //     winner: null,
    //     selectedItems: [],
    // });

    // if (alone) {
    //     this.timerRepo.resetTimerTransaction(transaction, questionId);
    // }
    throw new Error('Not implemented');
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
    throw new Error('Not implemented');
  }

  async endQuestion(questionId) {
    if (!questionId) {
      throw new Error('Question ID is required');
    }

    try {
      await runTransaction(firestore, (transaction) => this.endQuestionTransaction(transaction, questionId));
    } catch (error) {
      console.error('There was an error ending the question', error);
      throw error;
    }
  }

  async endQuestionTransaction(transaction, questionId) {
    // Update game status
    await this.gameRepo.updateGameTransaction(transaction, this.gameId, {
      status: GameStatus.QUESTION_END,
    });

    await this.gameQuestionRepo.updateTransaction(transaction, questionId, {
      dateEnd: serverTimestamp(),
    });

    await this.timerRepo.prepareTimerForReadyTransaction(transaction);
  }

  async updateQuestionWinner(questionId, playerId, teamId) {
    if (!questionId) {
      throw new Error('Question ID is required');
    }
    if (!playerId) {
      throw new Error('Player ID is required');
    }
    if (!teamId) {
      throw new Error('Team ID is required');
    }

    try {
      await runTransaction(firestore, (transaction) =>
        this.updateQuestionWinnerTransaction(transaction, questionId, playerId, teamId)
      );
    } catch (error) {
      console.error('There was an error updating the question winner', error);
      throw error;
    }
  }

  async updateQuestionWinnerTransaction(transaction, questionId, playerId, teamId) {
    await this.gameQuestionRepo.updateTransaction(transaction, questionId, {
      winner: {
        playerId,
        teamId,
      },
    });
  }
}
