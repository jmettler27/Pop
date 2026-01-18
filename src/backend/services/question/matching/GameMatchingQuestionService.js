import { runTransaction } from 'firebase/firestore';
import { firestore } from '@/backend/firebase/firebase';

import GameQuestionService from '@/backend/services/question/GameQuestionService';

import ChooserRepository from '@/backend/repositories/user/ChooserRepository';

import { PlayerStatus } from '@/backend/models/users/Player';
import { GameMatchingQuestion } from '@/backend/models/questions/Matching';
import { QuestionType } from '@/backend/models/questions/QuestionType';
import { ScorePolicyType } from '@/backend/models/ScorePolicy';

import { sortAscendingRoundScores } from '@/backend/utils/rounds';
import { sortScores } from '@/backend/utils/scores';
import { aggregateTiedTeams, findNextAvailableChooser, shuffle } from '@/backend/utils/arrays';

export default class GameMatchingQuestionService extends GameQuestionService {
  constructor(gameId, roundId) {
    super(gameId, roundId, QuestionType.MATCHING);

    this.chooserRepo = new ChooserRepository(gameId);
  }

  async resetQuestionTransaction(transaction, questionId) {
    const chooser = await this.chooserRepo.resetChoosersTransaction(transaction);
    await this.gameQuestionRepo.resetQuestionTransaction(transaction, questionId);

    await this.playerRepo.updateTeamPlayersStatusTransaction(transaction, chooser.teamId, PlayerStatus.IDLE);
    // await super.resetQuestionTransaction(transaction, questionId);
    console.log(
      'Matching question successfully reset',
      'game',
      this.gameId,
      'round',
      this.roundId,
      'question',
      questionId
    );
  }

  async endQuestionTransaction(transaction, questionId) {
    await super.endQuestionTransaction(transaction, questionId);
    console.log(
      'Matching question successfully ended',
      'game',
      this.gameId,
      'round',
      this.roundId,
      'question',
      questionId
    );
  }

  async handleCountdownEndTransaction(transaction, questionId) {
    const baseQuestion = await this.baseQuestionRepo.getQuestionTransaction(transaction, questionId);
    const correctMatches = await this.gameQuestionRepo.getCorrectMatchesTransaction(transaction, questionId);
    const incorrectMatches = await this.gameQuestionRepo.getIncorrectMatchesTransaction(transaction, questionId);

    const correctMatchIndices = correctMatches.map((obj) => obj.matchIdx);
    const incorrectMatch = incorrectMatches.map((obj) => obj.match);
    const match = GameMatchingQuestion.generateMatch(
      baseQuestion.numRows,
      baseQuestion.numCols,
      incorrectMatch,
      correctMatchIndices
    );

    await this.submitMatchTransaction(transaction, questionId, 'system', null, match);
    console.log(
      'Matching question countdown end successfully handled',
      'game',
      this.gameId,
      'round',
      this.roundId,
      'question',
      questionId
    );
  }

  /* =============================================================================================================== */

  async submitMatch(questionId, userId, edges, match) {
    if (!questionId) {
      throw new Error('No question ID has been provided!');
    }
    if (!userId) {
      throw new Error('No user ID has been provided!');
    }
    if ((!edges || edges.length === 0) && (!match || match.length === 0)) {
      throw new Error('No edges nor rows have been provided!');
    }

    try {
      await runTransaction(firestore, (transaction) =>
        this.submitMatchTransaction(transaction, questionId, userId, edges, match)
      );
    } catch (error) {
      console.error(
        'Failed to submit the match',
        'game',
        this.gameId,
        'round',
        this.roundId,
        'question',
        questionId,
        'err',
        error
      );
      throw error;
    }
  }

  async submitMatchTransaction(transaction, questionId, userId, edges, match) {
    const { chooserOrder, chooserIdx } = await this.chooserRepo.getChooserTransaction(transaction, this.gameId);
    const teamId = chooserOrder[chooserIdx];

    // edges is an array of numCols objects of the form {from: origRow0_col0, to: origRow1_col1}
    const rows =
      match ||
      edges.flatMap((edge, idx) => {
        const fromNumericPart = parseInt(edge.from.match(/\d+/)[0]);
        const toNumericPart = parseInt(edge.to.match(/\d+/)[0]);
        return idx === 0 ? [fromNumericPart, toNumericPart] : [toNumericPart];
      });

    const isCorrect = rows.every((row) => row === rows[0]);

    if (isCorrect) {
      await this.handleCorrectMatchTransaction(transaction, questionId, userId, teamId, rows);
    } else {
      await this.handleIncorrectMatchTransaction(transaction, questionId, userId, teamId, rows);
    }
    // await this.timerRepo.resetTimerTransaction(transaction)
    console.log(
      'Match successfully submitted',
      'game',
      this.gameId,
      'round',
      this.roundId,
      'question',
      questionId,
      'user',
      userId,
      'team',
      teamId,
      'rows',
      rows
    );
  }

  async handleCorrectMatchTransaction(transaction, questionId, userId, teamId, rows) {
    const correctMatches = await this.gameQuestionRepo.getCorrectMatchesTransaction(transaction, questionId);
    const baseQuestion = await this.baseQuestionRepo.getQuestionTransaction(transaction, questionId);

    const isLastCorrectMatch = correctMatches.length === baseQuestion.numRows - 1;

    if (isLastCorrectMatch) {
      // Case 1.2: It is the last correct matching
      const roundScores = await this.roundRepo.getRoundScoresTransaction(transaction, this.gameId, this.roundId);
      const { scores: currRoundScores } = roundScores;
      await this.roundRepo.increaseRoundTeamScoreTransaction(
        transaction,
        this.gameId,
        this.roundId,
        questionId,
        teamId,
        0
      );

      await this.playerRepo.updateTeamPlayersStatusTransaction(transaction, teamId, PlayerStatus.CORRECT);
      await this.gameQuestionRepo.addCorrectMatchTransaction(transaction, questionId, rows[0], userId, teamId);

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
      const gameQuestion = this.gameQuestionRepo.getQuestionTransaction(transaction, questionId);
      const canceled = gameQuestion.canceled;
      const { chooserOrder, chooserIdx } = await this.chooserRepo.getChooserTransaction(transaction, this.gameId);

      const { newChooserIdx, newChooserTeamId } = findNextAvailableChooser(chooserIdx, chooserOrder, canceled);
      await this.chooserRepo.updateTeamPlayersStatusTransaction(transaction, newChooserIdx);

      await this.playerRepo.updateTeamPlayersStatusTransaction(transaction, newChooserTeamId, PlayerStatus.FOCUS);
      if (newChooserTeamId !== teamId) {
        await this.playerRepo.updateTeamPlayersStatusTransaction(transaction, teamId, PlayerStatus.IDLE);
      }

      await this.gameQuestionRepo.addCorrectMatchTransaction(transaction, questionId, rows[0], userId, teamId);
      await this.soundRepo.addSoundTransaction(transaction, 'OUI');
    }

    console.log(
      'Correct match successfully handled',
      'game',
      this.gameId,
      'round',
      this.roundId,
      'question',
      questionId,
      'user',
      userId,
      'team',
      teamId,
      'rows',
      rows
    );
  }

  // Case 2: The matching is incorrect
  async handleIncorrectMatchTransaction(transaction, questionId, userId, teamId, rows) {
    const game = await this.gameRepo.getGameTransaction(transaction, this.gameId);
    const { chooserOrder, chooserIdx } = await this.chooserRepo.getChooserTransaction(transaction, this.gameId);
    const round = await this.roundRepo.getRoundTransaction(transaction, this.roundId);
    const gameQuestion = await this.gameQuestionRepo.getQuestionTransaction(transaction, questionId);
    const roundScores = await this.roundScoreRepo.getScoresTransaction(transaction);

    const roundScorePolicy = game.roundScorePolicy;
    const penalty = round.mistakePenalty;
    const maxMistakes = round.maxMistakes;
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
      await this.decreaseGlobalTeamScoreTransaction(transaction, questionId, penalty, teamId);
    }

    // Update the mistake and canceled information
    await this.gameQuestionRepo.updateQuestionTransaction(transaction, questionId, {
      teamNumMistakes: newTeamNumMistakes,
      canceled: newCanceled,
    });

    // Log the match
    const numCols = rows.length;
    if (numCols > 2) {
      const [colIndices, rowIdx] = findMostFrequentValueAndIndices(rows);
      if (colIndices.length > 0 && rowIdx !== null) {
        await this.gameQuestionRepo.addPartiallyCorrectMatchTransaction(
          transaction,
          questionId,
          colIndices,
          rowIdx,
          userId,
          teamId
        );
      }
    }
    await this.gameQuestionRepo.addIncorrectMatchTransaction(transaction, questionId, rows, userId, teamId);

    // Switch to the next competing team, or end the question if all teams have been canceled

    // There are still competing teams => Set focus to the next competing team
    if (newCanceled.length < chooserOrder.length) {
      const { newChooserIdx, newChooserTeamId } = findNextAvailableChooser(chooserIdx, chooserOrder, newCanceled);
      await this.chooserRepo.updateChooserIndexTransaction(transaction, newChooserIdx);
      await this.playerRepo.updateTeamPlayersStatusTransaction(transaction, newChooserTeamId, PlayerStatus.FOCUS);
      await this.playerRepo.updateTeamPlayersStatusTransaction(
        transaction,
        teamId,
        isCanceled ? PlayerStatus.WRONG : PlayerStatus.IDLE
      );
      await this.soundRepo.addSoundTransaction(
        transaction,
        isCanceled ? 'zelda_wind_waker_kaboom' : 'zelda_wind_waker_sploosh'
      );
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
      await this.playerRepo.updateTeamPlayersStatusTransaction(transaction, teamId, PlayerStatus.WRONG);
      await this.soundRepo.addSoundTransaction(transaction, 'zelda_wind_waker_game_over');
      await this.endQuestionTransaction(transaction, questionId);
    }

    console.log(
      'Incorrect match successfully handled',
      'game',
      this.gameId,
      'round',
      this.roundId,
      'question',
      questionId,
      'user',
      userId,
      'team',
      teamId,
      'rows',
      rows
    );
  }
}
