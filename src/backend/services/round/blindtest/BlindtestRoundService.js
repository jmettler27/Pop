import GameBlindtestQuestionRepository from '@/backend/repositories/question/GameBlindtestQuestionRepository';
import BuzzerRoundService from '@/backend/services/round/BuzzerRoundService';
import { RoundType } from '@/models/rounds/RoundType';
import { PlayerStatus } from '@/models/users/Player';

export default class BlindtestRoundService extends BuzzerRoundService {
  constructor(gameId) {
    super(gameId, RoundType.BLINDTEST);
  }

  async moveToNextQuestionTransaction(transaction, roundId, questionOrder) {
    const gameQuestionRepo = new GameBlindtestQuestionRepository(this.gameId, roundId);

    /* Game: fetch next question and reset every player's state */
    const playerIds = await this.playerRepo.getAllPlayerIds();
    const round = await this.roundRepo.getRoundTransaction(transaction, roundId);

    const questionId = round.questions[questionOrder];
    const gameQuestion = await gameQuestionRepo.getQuestionTransaction(transaction, questionId);

    console.log('Resetting player statuses to IDLE');
    await this.playerRepo.updateAllPlayersStatusTransaction(transaction, PlayerStatus.IDLE, playerIds);

    console.log('Resetting timer for next question with thinking time', gameQuestion.thinkingTime);
    // await this.timerRepo.resetTimerTransaction(transaction, managedBy, defaultThinkingTime)
    await this.timerRepo.resetTimerTransaction(transaction, gameQuestion.thinkingTime);

    console.log('startQuestionTransaction');
    await gameQuestionRepo.startQuestionTransaction(transaction, questionId);
    console.log('Game question transaction started for next question', questionId);
    await this.roundRepo.setCurrentQuestionIdxTransaction(transaction, roundId, questionOrder);
    console.log('Current question index updated for next question', questionOrder);
    await this.gameRepo.setCurrentQuestionTransaction(transaction, this.gameId, questionId, this.roundType);
    console.log('Current question updated in game for next question', questionId);
    await this.readyRepo.resetReadyTransaction(transaction);
  }
}
