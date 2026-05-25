import { Transaction } from 'firebase/firestore';

import GameBlindtestQuestionRepository from '@/backend/repositories/question/GameBlindtestQuestionRepository';
import BuzzerRoundService from '@/backend/services/round/BuzzerRoundService';
import { QuestionType } from '@/models/questions/question-type';
import { RoundType } from '@/models/rounds/round-type';
import { PlayerStatus } from '@/models/users/player';

export default class BlindtestRoundService extends BuzzerRoundService {
  constructor(gameId: string) {
    super(gameId, RoundType.BLINDTEST);
  }

  async moveToNextQuestionTransaction(transaction: Transaction, roundId: string, questionOrder: number) {
    const gameQuestionRepo = new GameBlindtestQuestionRepository(this.gameId, roundId);

    /* Game: fetch next question and reset every player's state */
    const playerIds = await this.playerRepo.getAllPlayerIds();
    if (playerIds.length === 0) {
      console.log('No players found in game, cannot move to next question');
      throw new Error('No players found in game, cannot move to next question');
    }

    const round = await this.roundRepo.getRoundTransaction(transaction, roundId);
    if (!round) {
      console.log('Round not found, cannot move to next question');
      throw new Error('Round not found, cannot move to next question');
    }

    const questionId = round.questions[questionOrder];
    const gameQuestion = await gameQuestionRepo.getQuestionTransaction(transaction, questionId);
    if (!gameQuestion) {
      console.log('Question not found, cannot move to next question');
      throw new Error('Question not found, cannot move to next question');
    }

    await this.playerRepo.updateAllPlayersStatusTransaction(transaction, PlayerStatus.IDLE, playerIds);
    await this.timerRepo.resetTimerTransaction(transaction, gameQuestion.thinkingTime);
    await gameQuestionRepo.startQuestionTransaction(transaction, questionId);
    await this.roundRepo.setCurrentQuestionIdxTransaction(transaction, roundId, questionOrder);
    await this.gameRepo.setCurrentQuestionTransaction(
      transaction,
      this.gameId,
      questionId,
      this.roundType as QuestionType
    );
    await this.readyRepo.resetReadyTransaction(transaction);
  }
}
