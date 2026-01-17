import { PlayerStatus } from '@/backend/models/users/Player';

import GameMatchingQuestionRepository from '@/backend/repositories/question/game/GameMatchingQuestionRepository';

import RoundService from '@/backend/services/round/RoundService';
import { collection, doc, getDocs, query, serverTimestamp, where } from 'firebase/firestore';
import { GameStatus } from '@/backend/models/games/GameStatus';
import { GAMES_COLLECTION_REF, QUESTIONS_COLLECTION_REF } from '@/backend/firebase/firestore';
import { getDocDataTransaction } from '@/backend/services/utils';
import { DEFAULT_THINKING_TIME_SECONDS } from '@/backend/utils/question/question';
import { QuestionType } from '@/backend/models/questions/QuestionType';
import { getNextCyclicIndex } from '@/backend/utils/arrays';
import { updateTimerTransaction } from '@/backend/repositories/timer/timer';
import { TimerStatus } from '@/backend/models/Timer';
import { addSoundTransaction } from '@/backend/services/sound/sounds';

export default class MatchingRoundService extends RoundService {
  async handleRoundSelectedTransaction(transaction, roundId, userId) {
    const round = await this.roundRepo.getRoundTransaction(transaction, roundId);
    const chooser = await this.chooserRepo.getChooserTransaction(transaction, this.chooserId);
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
      dateStart: serverTimestamp(),
      order: newOrder,
      currentQuestionIdx: 0,
      maxPoints: 0,
    });

    // If it is the first round, find a random order for the chooser teams
    if (chooser.chooserOrder.length === 0 || chooser.chooserIdx === null) {
      const teamIds = await this.teamRepo.getShuffledTeamIds(transaction);
      await this.chooserRepo.updateChooserOrderTransaction(transaction, teamIds);
    }

    await this.chooserRepo.resetChoosersTransaction(transaction);

    await this.soundRepo.addSoundTransaction(transaction, 'super_mario_odyssey_moon');

    await this.gameRepo.updateGameTransaction(transaction, {
      currentRound: roundId,
      currentQuestion: null,
      status: GameStatus.ROUND_START,
    });

    console.log('Round successfully started', 'game', this.gameId, 'round', roundId);
  }

  async moveToNextQuestionTransaction(transaction, roundId, questionOrder) {
    /* Game: fetch next question and reset every player's state */
    const round = await this.roundRepo.getRoundTransaction(transaction, roundId);
    const chooser = await this.chooserRepo.getChooserTransaction(transaction, this.gameId);

    const questionId = round.questions[questionOrder];
    const baseQuestion = await this.baseQuestionRepo.getQuestionTransaction(transaction, questionId);

    const defaultThinkingTime = DEFAULT_THINKING_TIME_SECONDS[QuestionType.MATCHING];

    await this.chooserRepo.resetChoosersTransaction(transaction);
    const newChooserTeamId = chooser.chooserOrder[0];
    await this.playerRepo.updateTeamAndOtherTeamsPlayersStatusTransaction(
      transaction,
      newChooserTeamId,
      PlayerStatus.FOCUS,
      PlayerStatus.IDLE
    );

    // await this.timerRepo.resetTimerTransaction(transaction, { status: TimerStatus.RESET, managedBy, duration: defaultThinkingTime * (baseQuestion.details.numCols - 1) })
    await this.timerRepo.resetTimerTransaction(transaction, defaultThinkingTime * (baseQuestion.details.numCols - 1));

    await this.soundRepo.addSoundTransaction(transaction, 'skyrim_skill_increase');
    await this.gameQuestionRepo.startQuestionTransaction(transaction, questionId);
    await this.roundRepo.setCurrentQuestionIdxTransaction(questionOrder);
    await this.gameRepo.setCurrentQuestionTransaction(this.gameId, questionId);
    await this.readyRepo.resetReadyTransaction(transaction);
  }

  /* ============================================================================================================ */

  async calculateMaxPointsTransaction(transaction, round) {
    return round.questions.length * (round.rewardsPerQuestion + round.rewardsForBonus);
  }

  async prepareQuestionStartTransaction(transaction, questionId, questionOrder) {
    const baseQuestion = await this.baseQuestionRepo.getQuestionTransaction(transaction, questionId);
    const gameQuestion = await this.gameQuestionRepo.getQuestionTransaction(transaction, questionId);

    const chooser = await this.chooserRepo.getChooserTransaction(transaction);
    const newChooserIdx = 0;
    const newChooserTeamId = chooser.chooserOrder[newChooserIdx];

    const choosers = await this.playerRepo.getPlayersByTeamIdTransaction(transaction, newChooserTeamId);
    const nonChoosers = await this.playerRepo.getAllOtherPlayersTransaction(transaction, newChooserTeamId);

    await this.chooserRepo.updateChooserTransaction(transaction, {
      chooserIdx: newChooserIdx,
    });
    for (const player of choosers) {
      await this.playerRepo.updatePlayerStatusTransaction(transaction, player.id, PlayerStatus.FOCUS);
    }
    for (const player of nonChoosers) {
      await this.playerRepo.updatePlayerStatusTransaction(transaction, player.id, PlayerStatus.IDLE);
    }

    await this.timerRepo.resetTimerTransaction(transaction, gameQuestion.thinkingTime * (baseQuestion.numCols - 1));

    const gameQuestionRepo = new GameMatchingQuestionRepository(this.gameId, this.roundId);
    await gameQuestionRepo.startQuestionTransaction(transaction, questionId);
  }
}
