import { PlayerStatus } from '@/backend/models/users/Player';

import RoundService from '@/backend/services/round/RoundService';
import GameOddOneOutQuestionRepository from '@/backend/repositories/question/GameOddOneOutQuestionRepository';
import { GameStatus } from '@/backend/models/games/GameStatus';
import { serverTimestamp } from 'firebase/firestore';
import { DEFAULT_THINKING_TIME_SECONDS } from '@/backend/utils/question/question';
import { QuestionType } from '@/backend/models/questions/QuestionType';
import { RoundType } from '@/backend/models/rounds/RoundType';

export default class OddOneOutRoundService extends RoundService {
  constructor(gameId) {
    super(gameId, RoundType.ODD_ONE_OUT);
  }

  async handleRoundSelectedTransaction(transaction, roundId, userId) {
    const round = await this.roundRepo.getRoundTransaction(transaction, roundId);
    const chooser = await this.chooserRepo.getChooserTransaction(transaction);
    const game = await this.gameRepo.getGameTransaction(transaction, this.gameId);

    const currentRound = game.currentRound;
    const currentQuestion = game.currentQuestion;

    let prevOrder = -1;
    if (currentRound !== null) {
      const prevRound = await this.roundRepo.getRoundTransaction(transaction, currentRound);
      prevOrder = prevRound.order;
    }
    const newOrder = prevOrder + 1;

    if (round.dateStart && !round.dateEnd && currentQuestion) {
      await this.gameRepo.updateGameStatusTransaction(transaction, this.gameId, GameStatus.QUESTION_ACTIVE);
      return;
    }

    await this.roundRepo.updateRoundTransaction(transaction, roundId, {
      type: RoundType.ODD_ONE_OUT,
      dateStart: serverTimestamp(),
      order: newOrder,
      currentQuestionIdx: 0,
      maxPoints: 0,
    });

    // If it is the first round, find a random order for the chooser teams
    if (chooser.chooserOrder.length === 0 || chooser.chooserIdx === null) {
      const teamIds = await this.teamRepo.getShuffledTeamIds();
      await this.chooserRepo.updateChooserOrderTransaction(transaction, teamIds);
    }

    await this.chooserRepo.resetChoosersTransaction(transaction);

    await this.soundRepo.addSoundTransaction(transaction, 'super_mario_odyssey_moon');

    await this.gameRepo.updateGameTransaction(transaction, this.gameId, {
      currentRound: roundId,
      currentQuestion: null,
      currentQuestionType: this.roundType,
      status: GameStatus.ROUND_START,
    });

    console.log('Round successfully started', 'game', this.gameId, 'round', roundId);
  }

  async moveToNextQuestionTransaction(transaction, roundId, questionOrder) {
    const gameQuestionRepo = new GameOddOneOutQuestionRepository(this.gameId, roundId);

    /* Game: fetch next question and reset every player's state */
    const round = await this.roundRepo.getRoundTransaction(transaction, roundId);
    const chooser = await this.chooserRepo.getChooserTransaction(transaction);

    const questionId = round.questions[questionOrder];
    const baseQuestion = await this.baseQuestionRepo.getQuestionTransaction(transaction, questionId);

    // const baseQuestion = await getDocDataTransaction(transaction, baseQuestionRef)
    const defaultThinkingTime = DEFAULT_THINKING_TIME_SECONDS[QuestionType.MATCHING];

    await this.chooserRepo.resetChoosersTransaction(transaction);
    const newChooserTeamId = chooser.chooserOrder[0];
    await this.playerRepo.updateTeamAndOtherTeamsPlayersStatus(newChooserTeamId, PlayerStatus.FOCUS, PlayerStatus.IDLE);

    // await this.timerRepo.resetTimerTransaction(transaction, { status: TimerStatus.RESET, managedBy, duration: defaultThinkingTime })
    await this.timerRepo.resetTimerTransaction(transaction, defaultThinkingTime);

    await this.soundRepo.addSoundTransaction(transaction, 'skyrim_skill_increase');
    await gameQuestionRepo.startQuestionTransaction(transaction, questionId);
    await this.roundRepo.setCurrentQuestionIdxTransaction(transaction, roundId, questionOrder);
    await this.gameRepo.setCurrentQuestionTransaction(transaction, this.gameId, questionId, this.roundType);
    await this.readyRepo.resetReadyTransaction(transaction);
  }

  /* =============================================================================================================== */
}
