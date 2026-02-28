import { Timer, TimerStatus } from '@/backend/models/Timer';
import RoundService from '@/backend/services/round/RoundService';
import GameMCQQuestionRepository from '@/backend/repositories/question/GameMCQQuestionRepository';
import { ScorePolicyType } from '@/backend/models/ScorePolicy';
import { GameStatus } from '@/backend/models/games/GameStatus';
import { PlayerStatus } from '@/backend/models/users/Player';
import { serverTimestamp } from 'firebase/firestore';
import { getNextCyclicIndex, shuffle } from '@/backend/utils/arrays';
import { DEFAULT_THINKING_TIME_SECONDS } from '@/backend/utils/question/question';
import { QuestionType } from '@/backend/models/questions/QuestionType';
import { RoundType } from '@/backend/models/rounds/RoundType';

export default class MCQRoundService extends RoundService {
  constructor(gameId) {
    super(gameId, RoundType.MCQ);
  }

  async handleRoundSelectedTransaction(transaction, roundId, userId) {
    const round = await this.roundRepo.getRoundTransaction(transaction, roundId);
    const chooser = await this.chooserRepo.getChooserTransaction(transaction);
    const game = await this.gameRepo.getGameTransaction(transaction, this.gameId);

    const questionIds = round.questions;
    const roundScorePolicy = game.roundScorePolicy;
    const currentRound = game.currentRound;
    const currentQuestion = game.currentQuestion;

    let prevOrder = -1;
    if (currentRound !== null) {
      const prevRound = await this.roundRepo.getRoundTransaction(transaction, currentRound);
      prevOrder = prevRound.order;
    }
    const newOrder = prevOrder + 1;

    let maxPoints = null;
    if (roundScorePolicy === ScorePolicyType.COMPLETION_RATE) {
      maxPoints = await this.calculateMaxPointsTransaction(transaction, round);
    }

    if (round.dateStart && !round.dateEnd && currentQuestion) {
      await this.gameRepo.updateGameStatusTransaction(transaction, this.gameId, GameStatus.QUESTION_ACTIVE);
      return;
    }

    await this.roundRepo.updateRoundTransaction(transaction, roundId, {
      type: RoundType.MCQ,
      dateStart: serverTimestamp(),
      order: newOrder,
      currentQuestionIdx: 0,
      questions: shuffle(questionIds),
      ...(maxPoints !== null && { maxPoints }),
    });

    // If the round requires an order of chooser teams (e.g. OOO, MCQ) and it is the first round, find a random order for the chooser teams
    if (chooser.chooserOrder.length === 0 || chooser.chooserIdx === null) {
      const teamIds = await this.teamRepo.getShuffledTeamIds();
      await this.chooserRepo.updateChooserOrderTransaction(transaction, teamIds);
    }

    await this.chooserRepo.resetChoosersTransaction(transaction);

    await this.timerRepo.updateTimerTransaction(transaction, {
      status: TimerStatus.RESET,
      duration: Timer.READY_COUNTDOWN_SECONDS,
      authorized: false,
    });

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
    const gameQuestionRepo = new GameMCQQuestionRepository(this.gameId, roundId);

    /* Game: fetch next question and reset every player's state */
    const round = await this.roundRepo.getRoundTransaction(transaction, roundId);
    const chooser = await this.chooserRepo.getChooserTransaction(transaction);

    const questionId = round.questions[questionOrder];
    const defaultThinkingTime = DEFAULT_THINKING_TIME_SECONDS[QuestionType.MCQ];

    const chooserOrder = chooser.chooserOrder;
    const chooserIdx = chooser.chooserIdx;

    if (questionOrder > 0) {
      const newChooserIdx = getNextCyclicIndex(chooserIdx, chooserOrder.length);
      const newChooserTeamId = chooserOrder[newChooserIdx];
      await this.chooserRepo.updateChooserIndexTransaction(transaction, newChooserIdx);
      await gameQuestionRepo.updateQuestionTeamTransaction(transaction, questionId, newChooserTeamId);
      await this.playerRepo.updateTeamAndOtherTeamsPlayersStatus(
        newChooserTeamId,
        PlayerStatus.FOCUS,
        PlayerStatus.IDLE
      );
    } else {
      const chooserTeamId = chooserOrder[chooserIdx];
      await gameQuestionRepo.updateQuestionTeamTransaction(transaction, questionId, chooserTeamId);
    }

    // await this.timerRepo.resetTimerTransaction(transaction, { status: TimerStatus.RESET, managedBy, duration: defaultThinkingTime })
    await this.timerRepo.resetTimerTransaction(transaction, defaultThinkingTime);

    await this.soundRepo.addSoundTransaction(transaction, 'skyrim_skill_increase');
    await gameQuestionRepo.startQuestionTransaction(transaction, questionId);
    await this.roundRepo.setCurrentQuestionIdxTransaction(transaction, roundId, questionOrder);
    await this.gameRepo.setCurrentQuestionTransaction(transaction, this.gameId, questionId, this.roundType);
    await this.readyRepo.resetReadyTransaction(transaction);
  }

  /* =============================================================================================================== */

  async calculateMaxPointsTransaction(transaction, round) {
    const numTeams = await this.teamRepo.getNumTeams(transaction);
    return Math.ceil(round.questions.length / numTeams) * round.rewardsPerQuestion;
  }
}
