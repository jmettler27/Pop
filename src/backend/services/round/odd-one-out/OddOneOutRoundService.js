import { serverTimestamp } from 'firebase/firestore';

import GameOddOneOutQuestionRepository from '@/backend/repositories/question/GameOddOneOutQuestionRepository';
import RoundService from '@/backend/services/round/RoundService';
import { GameStatus } from '@/models/games/GameStatus';
import { RoundType } from '@/models/rounds/RoundType';
import { Timer } from '@/models/Timer';
import { PlayerStatus } from '@/models/users/Player';

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

    await this.timerRepo.resetTimerTransaction(transaction, Timer.READY_COUNTDOWN_SECONDS);

    console.log('Round successfully started', 'game', this.gameId, 'round', roundId);
  }

  async moveToNextQuestionTransaction(transaction, roundId, questionOrder) {
    const gameQuestionRepo = new GameOddOneOutQuestionRepository(this.gameId, roundId);

    /* Game: fetch next question and reset every player's state */
    const round = await this.roundRepo.getRoundTransaction(transaction, roundId);
    const chooser = await this.chooserRepo.getChooserTransaction(transaction);

    const questionId = round.questions[questionOrder];
    const gameQuestion = await gameQuestionRepo.getQuestionTransaction(transaction, questionId);

    await this.chooserRepo.resetChoosersTransaction(transaction);
    const newChooserTeamId = chooser.chooserOrder[0];
    await this.playerRepo.updateTeamAndOtherTeamsPlayersStatus(newChooserTeamId, PlayerStatus.FOCUS, PlayerStatus.IDLE);
    await this.timerRepo.startTimerTransaction(transaction, gameQuestion.thinkingTime);
    await this.soundRepo.addSoundTransaction(transaction, 'skyrim_skill_increase');
    await this.roundRepo.setCurrentQuestionIdxTransaction(transaction, roundId, questionOrder);
    await this.gameRepo.setCurrentQuestionTransaction(transaction, this.gameId, questionId, this.roundType);
    await this.readyRepo.resetReadyTransaction(transaction);
    await gameQuestionRepo.startQuestionTransaction(transaction, questionId);
  }

  /* =============================================================================================================== */
}
