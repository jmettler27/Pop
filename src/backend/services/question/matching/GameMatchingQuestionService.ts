import { runTransaction, Transaction } from 'firebase/firestore';

import { firestore } from '@/backend/firebase/firebase';
import { logger } from '@/backend/logger';
import GameMatchingQuestionRepository from '@/backend/repositories/question/GameMatchingQuestionRepository';
import RoundRepository from '@/backend/repositories/round/RoundRepository';
import ChooserRepository from '@/backend/repositories/user/ChooserRepository';
import GameQuestionService, { SYSTEM_PLAYER_ID } from '@/backend/services/question/GameQuestionService';
import { aggregateTiedTeams, findNextAvailableChooser, shuffle } from '@/backend/utils/arrays';
import { sortAscendingRoundScores, sortScores } from '@/backend/utils/scores';
import {
  ColumnIndices,
  CorrectMatch,
  GameMatchingQuestion,
  IncorrectMatch,
  MatchingEdgeData,
  MatchingQuestion,
} from '@/models/questions/matching';
import { QuestionType } from '@/models/questions/question-type';
import { MatchingRound } from '@/models/rounds/matching';
import { ScorePolicyType } from '@/models/score-policy';
import { PlayerStatus } from '@/models/users/player';

export default class GameMatchingQuestionService extends GameQuestionService {
  readonly chooserRepo: ChooserRepository;

  constructor(gameId: string, roundId: string) {
    super(gameId, roundId, QuestionType.MATCHING);
    this.log = logger.child({ module: 'GameMatchingQuestionService', game: gameId, round: roundId });
    this.chooserRepo = new ChooserRepository(gameId);
  }

  async resetQuestionTransaction(transaction: Transaction, questionId: string) {
    const gameQuestion = (await (this.gameQuestionRepo as GameMatchingQuestionRepository).getQuestionTransaction(
      transaction,
      questionId
    )) as GameMatchingQuestion;
    if (!gameQuestion) {
      this.log.warn({ question: questionId }, 'Game question not found');
      throw new Error('Game question not found');
    }

    const chooser = await this.chooserRepo.resetAndGetChoosersTransaction(transaction);
    if (chooser) {
      const chooserTeamId = chooser.chooserOrder[chooser.chooserIdx];
      await this.playerRepo.updateTeamPlayersStatus(chooserTeamId, PlayerStatus.FOCUS);
    }
    await (this.gameQuestionRepo as GameMatchingQuestionRepository).resetQuestionTransaction(transaction, questionId);
    await this.timerRepo.resetTimerTransaction(transaction, gameQuestion.thinkingTime);

    this.log.info({ question: questionId }, 'Matching question reset');
  }

  async endQuestionTransaction(transaction: Transaction, questionId: string) {
    await super.endQuestionTransaction(transaction, questionId);
    this.log.info({ question: questionId }, 'Matching question ended');
  }

  async handleCountdownEndTransaction(transaction: Transaction, questionId: string) {
    const baseQuestion = (await this.baseQuestionRepo.getQuestionTransaction(
      transaction,
      questionId
    )) as MatchingQuestion;
    if (!baseQuestion) {
      this.log.warn({ question: questionId }, 'Base question not found');
      throw new Error('Base question not found');
    }

    const correctMatches = await (this.gameQuestionRepo as GameMatchingQuestionRepository).getCorrectMatchesTransaction(
      transaction,
      questionId
    );
    if (!correctMatches) {
      this.log.warn({ question: questionId }, 'Correct matches not found');
      throw new Error('Correct matches not found');
    }

    const incorrectMatches = await (
      this.gameQuestionRepo as GameMatchingQuestionRepository
    ).getIncorrectMatchesTransaction(transaction, questionId);
    if (!incorrectMatches) {
      this.log.warn({ question: questionId }, 'Incorrect matches not found');
      throw new Error('Incorrect matches not found');
    }

    const correctMatchIndices = correctMatches.map((m: CorrectMatch) => m.matchIdx);
    const incorrectMatch = incorrectMatches.map((m: IncorrectMatch) => m.match);
    const match = GameMatchingQuestion.generateMatch(
      baseQuestion.numRows!,
      baseQuestion.numCols!,
      incorrectMatch,
      correctMatchIndices
    );

    await this.submitMatchTransaction(transaction, questionId, SYSTEM_PLAYER_ID, null, match);
    this.log.info({ question: questionId }, 'Matching question countdown end handled');
  }

  /* =============================================================================================================== */

  async submitMatch(questionId: string, playerId: string, edges: MatchingEdgeData[], match: ColumnIndices | null) {
    if (!questionId) {
      throw new Error('No question ID has been provided!');
    }
    if (!playerId) {
      throw new Error('No user ID has been provided!');
    }
    if ((!edges || edges.length === 0) && (!match || match.length === 0)) {
      throw new Error('No edges nor rows have been provided!');
    }

    try {
      await runTransaction(firestore, (transaction) =>
        this.submitMatchTransaction(transaction, questionId, playerId, edges, match)
      );
    } catch (error) {
      this.log.error({ question: questionId, err: error }, 'Failed to submit the match');
      throw error;
    }
  }

  async submitMatchTransaction(
    transaction: Transaction,
    questionId: string,
    playerId: string,
    edges: MatchingEdgeData[] | null,
    match: ColumnIndices | null
  ) {
    const chooser = await this.chooserRepo.getChooserTransaction(transaction);
    if (!chooser) {
      this.log.warn({ question: questionId }, 'Chooser not found');
      throw new Error('Chooser not found');
    }

    const teamId = chooser.chooserOrder[chooser.chooserIdx];
    if (playerId != SYSTEM_PLAYER_ID) {
      const player = await this.playerRepo.getPlayerTransaction(transaction, playerId);
      if (!player) {
        this.log.warn({ question: questionId, user: playerId }, 'Player not found');
        throw new Error('Player not found');
      }
      if (player.teamId !== teamId) {
        this.log.warn(
          { question: questionId, user: playerId, playerTeam: player.teamId, chooserTeam: teamId },
          'Player is not in the chooser team'
        );
        throw new Error('Player is not in the chooser team');
      }
    }

    // edges is an array of numCols objects of the form {from: origRow0_col0, to: origRow1_col1}
    const rows =
      match ||
      edges!.flatMap((edge: MatchingEdgeData, idx: number) => {
        const fromNumericPart = parseInt(edge.from.match(/\d+/)![0]);
        const toNumericPart = parseInt(edge.to.match(/\d+/)![0]);
        return idx === 0 ? [fromNumericPart, toNumericPart] : [toNumericPart];
      });

    const isCorrect = rows.every((row) => row === rows[0]);

    if (isCorrect) {
      await this.handleCorrectMatchTransaction(transaction, questionId, playerId, teamId, rows);
    } else {
      await this.handleIncorrectMatchTransaction(transaction, questionId, playerId, teamId, rows);
    }
    this.log.info({ question: questionId, user: playerId, team: teamId, rows }, 'Match submitted');
  }

  async handleCorrectMatchTransaction(
    transaction: Transaction,
    questionId: string,
    userId: string,
    teamId: string,
    rows: ColumnIndices
  ) {
    const correctMatches = await (this.gameQuestionRepo as GameMatchingQuestionRepository).getCorrectMatchesTransaction(
      transaction,
      questionId
    );
    if (!correctMatches) {
      this.log.warn({ question: questionId }, 'Correct matches not found');
      throw new Error('Correct matches not found');
    }

    const baseQuestion = (await this.baseQuestionRepo.getQuestionTransaction(
      transaction,
      questionId
    )) as MatchingQuestion;
    if (!baseQuestion) {
      this.log.warn({ question: questionId }, 'Base question not found');
      throw new Error('Base question not found');
    }

    const isLastCorrectMatch = correctMatches.length === baseQuestion.numRows! - 1;

    if (isLastCorrectMatch) {
      // Case 1.2: It is the last correct matching
      const roundScores = await this.roundScoreRepo.getScoresTransaction(transaction);
      if (!roundScores) {
        this.log.warn({ question: questionId }, 'Round scores not found');
        throw new Error('Round scores not found');
      }

      const { scores: currRoundScores } = roundScores;

      await this.roundScoreRepo.increaseTeamScoreTransaction(transaction, questionId, teamId, 0);

      await this.playerRepo.updateTeamPlayersStatus(teamId, PlayerStatus.CORRECT);
      await (this.gameQuestionRepo as GameMatchingQuestionRepository).addCorrectMatchTransaction(
        transaction,
        questionId,
        rows[0],
        userId,
        teamId
      );

      const sortedUniqueRoundScores = sortScores(currRoundScores, sortAscendingRoundScores('matching'));
      const roundSortedTeams = aggregateTiedTeams(sortedUniqueRoundScores, currRoundScores);
      const newChooserOrder = roundSortedTeams
        .slice()
        .reverse()
        .flatMap(({ teams }) => shuffle(teams));
      await this.chooserRepo.updateChooserOrderTransaction(transaction, newChooserOrder);
      await this.soundRepo.addSoundTransaction(transaction, 'zelda_secret_door');
      await this.endQuestionTransaction(transaction, questionId);
    } else {
      // Case 1.1: The matching is correct but not the last one

      // Switch to the next competing team
      const gameQuestion = (await (this.gameQuestionRepo as GameMatchingQuestionRepository).getQuestionTransaction(
        transaction,
        questionId
      )) as GameMatchingQuestion;
      if (!gameQuestion) {
        this.log.warn({ question: questionId }, 'Game question not found');
        throw new Error('Game question not found');
      }
      const canceled = gameQuestion.canceled;

      const chooser = await this.chooserRepo.getChooserTransaction(transaction);
      if (!chooser) {
        this.log.warn({ question: questionId }, 'Chooser not found');
        throw new Error('Chooser not found');
      }
      const chooserIdx = chooser.chooserIdx;
      const chooserOrder = chooser.chooserOrder;

      const { newChooserIdx, newChooserTeamId } = findNextAvailableChooser(chooserIdx, chooserOrder, canceled);
      await this.chooserRepo.updateChooserIndexTransaction(transaction, newChooserIdx);
      await this.playerRepo.updateTeamPlayersStatus(newChooserTeamId, PlayerStatus.FOCUS);
      if (newChooserTeamId !== teamId) {
        await this.playerRepo.updateTeamPlayersStatus(teamId, PlayerStatus.IDLE);
      }

      await (this.gameQuestionRepo as GameMatchingQuestionRepository).addCorrectMatchTransaction(
        transaction,
        questionId,
        rows[0],
        userId,
        teamId
      );
      await this.soundRepo.addSoundTransaction(transaction, 'oui');
      await this.timerRepo.startTimerTransaction(transaction, gameQuestion.thinkingTime * (baseQuestion.numCols! - 1));
    }

    this.log.info({ question: questionId, user: userId, team: teamId, rows }, 'Correct match handled');
  }

  // Case 2: The matching is incorrect
  async handleIncorrectMatchTransaction(
    transaction: Transaction,
    questionId: string,
    userId: string,
    teamId: string,
    rows: ColumnIndices
  ) {
    const roundRepo = new RoundRepository(this.gameId);

    const game = await this.gameRepo.getGameTransaction(transaction, this.gameId);
    if (!game) {
      this.log.warn({ question: questionId }, 'Game not found');
      throw new Error('Game not found');
    }
    const chooser = await this.chooserRepo.getChooserTransaction(transaction);
    if (!chooser) {
      this.log.warn({ question: questionId }, 'Chooser not found');
      throw new Error('Chooser not found');
    }
    const chooserOrder = chooser.chooserOrder;
    const chooserIdx = chooser.chooserIdx;

    const round = await roundRepo.getRoundTransaction(transaction, this.roundId);
    if (!round) {
      this.log.warn({ question: questionId }, 'Round not found');
      throw new Error('Round not found');
    }
    const matchingRound = round as MatchingRound;

    const gameQuestion = (await (this.gameQuestionRepo as GameMatchingQuestionRepository).getQuestionTransaction(
      transaction,
      questionId
    )) as GameMatchingQuestion;
    if (!gameQuestion) {
      this.log.warn({ question: questionId }, 'Game question not found');
      throw new Error('Game question not found');
    }

    const baseQuestion = (await this.baseQuestionRepo.getQuestionTransaction(
      transaction,
      questionId
    )) as MatchingQuestion;
    if (!baseQuestion) {
      this.log.warn({ question: questionId }, 'Base question not found');
      throw new Error('Base question not found');
    }

    const roundScores = await this.roundScoreRepo.getScoresTransaction(transaction);
    if (!roundScores) {
      this.log.warn({ question: questionId }, 'Round scores not found');
      throw new Error('Round scores not found');
    }

    const roundScorePolicy = game.roundScorePolicy;
    const penalty = matchingRound.mistakePenalty;
    const maxMistakes = matchingRound.maxMistakes;
    const teamNumMistakes = gameQuestion.teamNumMistakes;
    const canceled = gameQuestion.canceled;

    // Increase the number of mistakes of the team
    const newTeamNumMistakes = { ...teamNumMistakes };
    newTeamNumMistakes[teamId] = (teamNumMistakes[teamId] || 0) + 1;

    // If the team has reached the maximum number of mistakes, cancel it
    const isCanceled = GameMatchingQuestion.matchingTeamIsCanceled(teamId, newTeamNumMistakes, maxMistakes);
    const newCanceled = isCanceled ? [...canceled, teamId] : canceled;

    if (roundScorePolicy === ScorePolicyType.RANKING) {
      // Increase the team's round score to 1
      await this.roundScoreRepo.increaseTeamScoreTransaction(transaction, questionId, teamId, penalty);
    } else if (roundScorePolicy === ScorePolicyType.COMPLETION_RATE) {
      // Decrease the team's global score by the penalty and increment the number of mistakes of the team in the round
      await this.increaseGlobalTeamScoreTransaction(transaction, questionId, penalty, teamId);
    }

    // Update the mistake and canceled information
    await (this.gameQuestionRepo as GameMatchingQuestionRepository).updateQuestionTransaction(transaction, questionId, {
      teamNumMistakes: newTeamNumMistakes,
      canceled: newCanceled,
    });

    // Log the match
    const numCols = rows.length;
    if (numCols > 2) {
      const [colIndices, rowIdx] = GameMatchingQuestion.findMostFrequentValueAndIndices(rows);
      if (colIndices.length > 0 && rowIdx !== null) {
        await (this.gameQuestionRepo as GameMatchingQuestionRepository).addPartiallyCorrectMatchTransaction(
          transaction,
          questionId,
          colIndices,
          rowIdx,
          userId,
          teamId
        );
      }
    }
    await (this.gameQuestionRepo as GameMatchingQuestionRepository).addIncorrectMatchTransaction(
      transaction,
      questionId,
      rows,
      userId,
      teamId
    );

    // Switch to the next competing team, or end the question if all teams have been canceled

    // There are still competing teams => Set focus to the next competing team
    if (newCanceled.length < chooserOrder.length) {
      const { newChooserIdx, newChooserTeamId } = findNextAvailableChooser(chooserIdx, chooserOrder, newCanceled);
      await this.chooserRepo.updateChooserIndexTransaction(transaction, newChooserIdx);

      await this.playerRepo.updateTeamPlayersStatus(newChooserTeamId, PlayerStatus.FOCUS);
      await this.playerRepo.updateTeamPlayersStatus(teamId, isCanceled ? PlayerStatus.WRONG : PlayerStatus.IDLE);
      await this.soundRepo.addSoundTransaction(
        transaction,
        isCanceled ? 'zelda_wind_waker_kaboom' : 'zelda_wind_waker_sploosh'
      );
      await this.timerRepo.startTimerTransaction(transaction, gameQuestion.thinkingTime * (baseQuestion.numCols! - 1));
    } else {
      // All teams have been canceled => End the question
      const { scores: currRoundScores } = roundScores;
      const sortedUniqueRoundScores = sortScores(currRoundScores, sortAscendingRoundScores('matching'));
      const roundSortedTeams = aggregateTiedTeams(sortedUniqueRoundScores, currRoundScores);
      const newChooserOrder = roundSortedTeams
        .slice()
        .reverse()
        .flatMap(({ teams }) => shuffle(teams));
      await this.chooserRepo.updateChooserOrderTransaction(transaction, newChooserOrder);
      await this.playerRepo.updateTeamPlayersStatus(teamId, PlayerStatus.WRONG);
      await this.soundRepo.addSoundTransaction(transaction, 'zelda_wind_waker_game_over');
      await this.endQuestionTransaction(transaction, questionId);
    }

    this.log.info({ question: questionId, user: userId, team: teamId, rows }, 'Incorrect match handled');
  }
}
