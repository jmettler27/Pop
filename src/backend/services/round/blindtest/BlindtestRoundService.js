import BuzzerRoundService from '@/backend/services/round/BuzzerRoundService';
import { DEFAULT_THINKING_TIME_SECONDS } from '@/backend/utils/question/question';
import { QuestionType } from '@/backend/models/questions/QuestionType';
import { PlayerStatus } from '@/backend/models/users/Player';
import { RoundType } from '@/backend/models/rounds/RoundType';

export default class BlindtestRoundService extends BuzzerRoundService {
  constructor(gameId) {
    super(gameId, RoundType.BLINDTEST);
  }

  async moveToNextQuestionTransaction(transaction, roundId, questionOrder) {
    /* Game: fetch next question and reset every player's state */
    const playerIds = await this.playerRepo.getAllPlayerIds();
    const round = await this.roundRepo.getRoundTransaction(transaction, roundId);

    const questionId = round.questions[questionOrder];
    const defaultThinkingTime = DEFAULT_THINKING_TIME_SECONDS[QuestionType.MATCHING];

    await this.playerRepo.updateAllPlayersStatusTransaction(transaction, PlayerStatus.IDLE, playerIds);

    // await this.timerRepo.resetTimerTransaction(transaction, managedBy, defaultThinkingTime)
    await this.timerRepo.resetTimerTransaction(transaction, defaultThinkingTime);

    await this.gameQuestionRepo.startQuestionTransaction(transaction, questionId);
    await this.roundRepo.setCurrentQuestionIdxTransaction(questionOrder);
    await this.gameRepo.setCurrentQuestionTransaction(this.gameId, questionId);
    await this.readyRepo.resetReadyTransaction(transaction);
  }
}
