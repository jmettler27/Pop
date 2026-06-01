import { collection, getDocs, query, runTransaction, Transaction, where } from 'firebase/firestore';
import type { Logger } from 'pino';

import { firestore } from '@/backend/firebase/firebase';
import { GAMES_COLLECTION_REF } from '@/backend/firebase/firestore';
import { logger } from '@/backend/logger';
import GameRepository from '@/backend/repositories/game/GameRepository';
import BaseQuestionRepository from '@/backend/repositories/question/BaseQuestionRepository';
import BaseQuestionRepositoryFactory from '@/backend/repositories/question/BaseQuestionRepositoryFactory';
import GameQuestionRepositoryFactory from '@/backend/repositories/question/GameQuestionRepositoryFactory';
import RoundRepository from '@/backend/repositories/round/RoundRepository';
import GameScoreRepository from '@/backend/repositories/score/GameScoreRepository';
import RoundScoreRepository from '@/backend/repositories/score/RoundScoreRepository';
import SoundRepository from '@/backend/repositories/sound/SoundRepository';
import TimerRepository from '@/backend/repositories/timer/TimerRepository';
import ChooserRepository from '@/backend/repositories/user/ChooserRepository';
import PlayerRepository from '@/backend/repositories/user/PlayerRepository';
import ReadyRepository from '@/backend/repositories/user/ReadyRepository';
import TeamRepository from '@/backend/repositories/user/TeamRepository';
import GameQuestionServiceFactory from '@/backend/services/question/GameQuestionServiceFactory';
import { aggregateTiedTeams, shuffle } from '@/backend/utils/arrays';
import { sortAscendingRoundScores, sortScores } from '@/backend/utils/scores';
import { GameStatus } from '@/models/games/game-status';
import { type QuestionType } from '@/models/questions/question-type';
import { AnyGameQuestion } from '@/models/questions/QuestionFactory';
import { Round } from '@/models/rounds/round';
import { RoundType } from '@/models/rounds/round-type';
import { AnyRound } from '@/models/rounds/RoundFactory';
import { ScorePolicyType } from '@/models/score-policy';
import { Scores, ScoresProgress } from '@/models/scores';
import { PlayerStatus } from '@/models/users/player';

export default class RoundService {
  protected gameId: string;
  protected gameRepo: GameRepository;
  protected roundRepo: RoundRepository;
  protected gameScoreRepo: GameScoreRepository;
  protected roundType: RoundType;
  protected playerRepo: PlayerRepository;
  protected teamRepo: TeamRepository;
  protected chooserRepo: ChooserRepository;
  protected timerRepo: TimerRepository;
  protected soundRepo: SoundRepository;
  protected readyRepo: ReadyRepository;
  protected baseQuestionRepo: BaseQuestionRepository;
  protected log: Logger;

  constructor(gameId: string, roundType: RoundType) {
    if (!gameId) {
      throw new Error('Game ID is required');
    }
    if (!roundType) {
      throw new Error('Round type is required');
    }

    this.gameId = gameId;
    this.log = logger.child({ module: 'RoundService', game: this.gameId });

    this.gameRepo = new GameRepository();
    this.gameScoreRepo = new GameScoreRepository(this.gameId);

    this.playerRepo = new PlayerRepository(this.gameId);
    this.teamRepo = new TeamRepository(this.gameId);
    this.chooserRepo = new ChooserRepository(this.gameId);
    this.timerRepo = new TimerRepository(this.gameId);
    this.soundRepo = new SoundRepository(this.gameId);
    this.readyRepo = new ReadyRepository(this.gameId);

    this.roundType = roundType;
    this.roundRepo = new RoundRepository(this.gameId);

    this.baseQuestionRepo = BaseQuestionRepositoryFactory.createRepository(this.roundType as unknown as QuestionType);
    // this.gameQuestionRepo = GameQuestionRepositoryFactory.createRepository(this.roundType, this.gameId);
  }

  async resetRound(roundId: string) {
    const gameQuestionService = GameQuestionServiceFactory.createService(
      this.roundType as unknown as QuestionType,
      this.gameId,
      roundId
    );
    const gameQuestionRepo = GameQuestionRepositoryFactory.createRepository(
      this.roundType as unknown as QuestionType,
      this.gameId,
      roundId
    );
    const roundScoreRepo = new RoundScoreRepository(this.gameId, roundId);

    const questions = await gameQuestionRepo.getAllQuestions();
    if (!questions) {
      this.log.warn({ round: roundId }, 'No questions found when resetting round');
      throw new Error('No questions found when resetting round');
    }

    const initTeamScores = await this.getInitTeamScores();
    if (!initTeamScores) {
      this.log.warn({ round: roundId }, 'Failed to get initial team scores when resetting round');
      throw new Error('Failed to get initial team scores when resetting round');
    }

    for (const question of questions) {
      await gameQuestionService.resetQuestion(question.id as string);
    }
    await roundScoreRepo.resetScores(initTeamScores);
    await this.roundRepo.resetRound(roundId, this.roundType);

    this.log.info({ round: roundId }, 'Round successfully reset');
  }

  async getInitTeamScores() {
    const teams = await this.teamRepo.getAllTeams();
    if (!teams) {
      this.log.warn('No teams found when getting initial team scores');
      throw new Error('No teams found when getting initial team scores');
    }

    return Object.fromEntries(teams.map((t) => [t.id, 0]));
  }

  /**
   * round_start -> question_active
   */
  async startRound(roundId: string) {
    try {
      await runTransaction(firestore, (transaction) => this.startRoundTransaction(transaction, roundId));
    } catch (error) {
      this.log.error({ err: error }, 'Error starting round');
      throw error;
    }
  }

  async startRoundTransaction(transaction: Transaction, roundId: string) {
    await this.moveToNextQuestionTransaction(transaction, roundId, 0);

    this.log.info({ round: roundId }, 'Round successfully started');
  }

  async moveToNextQuestionTransaction(transaction: Transaction, roundId: string, questionOrder: number) {
    throw new Error('Not implemented');
  }

  /**
   * question_end -> question_active or
   * question_end -> round_end
   */
  async handleQuestionEnd(roundId: string, questionId: string) {
    if (!roundId) {
      throw new Error('Round ID is required');
    }
    if (!questionId) {
      throw new Error('Question ID is required');
    }

    try {
      await runTransaction(firestore, (transaction) =>
        this.handleQuestionEndTransaction(transaction, roundId, questionId)
      );
    } catch (error) {
      this.log.error({ err: error }, 'Error handling question end');
      throw error;
    }
  }

  async handleQuestionEndTransaction(transaction: Transaction, roundId: string, questionId: string) {
    const round = await this.roundRepo.getRoundTransaction(transaction, roundId);
    if (!round) {
      this.log.warn({ round: roundId }, 'Round not found');
      throw new Error('Round not found');
    }
    const isRoundOver = (round.currentQuestionIdx ?? 0) === round.questions.length - 1;

    isRoundOver
      ? await this.endRoundTransaction(transaction, roundId)
      : await this.moveToNextQuestionTransaction(transaction, roundId, (round.currentQuestionIdx ?? 0) + 1);
    // await (round.isLastQuestion() ?
    //         this.endRoundTransaction(transaction) : /* End of round */
    //         this.moveToNextQuestionTransaction(transaction, round.currentQuestionIdx + 1) /* Prepare the next question */
    // )
  }

  /**
   * question_end -> round_end
   */
  async endRound(roundId: string) {
    if (!roundId) {
      throw new Error('Round ID is required');
    }

    try {
      await runTransaction(firestore, async (transaction) => await this.endRoundTransaction(transaction, roundId));
    } catch (error) {
      this.log.error({ err: error }, 'Error ending round');
      throw error;
    }
  }

  async endRoundTransaction(transaction: Transaction, roundId: string) {
    const gameQuestionRepo = GameQuestionRepositoryFactory.createRepository(
      this.roundType as unknown as QuestionType,
      this.gameId,
      roundId
    );
    const roundScoreRepo = new RoundScoreRepository(this.gameId, roundId);

    const game = await this.gameRepo.getGameTransaction(transaction, this.gameId);
    if (!game) {
      this.log.warn({ round: roundId }, 'Game not found');
      throw new Error('Game not found');
    }

    const round = await this.roundRepo.getRoundTransaction(transaction, roundId);
    if (!round) {
      this.log.warn({ round: roundId }, 'Round not found');
      throw new Error('Round not found');
    }

    const gameScoresData = await this.gameScoreRepo.getScoresTransaction(transaction);
    if (!gameScoresData) {
      this.log.warn({ round: roundId }, 'Game scores not found when ending round');
      throw new Error('Game scores not found when ending round');
    }

    const roundScoresData = await roundScoreRepo.getScoresTransaction(transaction);
    if (!roundScoresData) {
      this.log.warn({ round: roundId }, 'Round scores not found when ending round');
      throw new Error('Round scores not found when ending round');
    }

    const currentGlobalScores: Scores = (gameScoresData!.scores ?? {}) as Scores;
    const currentGlobalScoresProgress: ScoresProgress = gameScoresData!.scoresProgress ?? {};

    const roundScores: Scores = (roundScoresData!.scores ?? {}) as Scores;
    const currRoundScoresProgress: Record<string, unknown> = (roundScoresData!.scoresProgress ?? {}) as Record<
      string,
      unknown
    >;

    const questionIds = round.questions;
    const roundType = round.type as string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rewardsPerQuestion = (round as any).rewardsPerQuestion;

    let newChooserOrder;
    let roundSortedTeams;
    let roundCompletionRates = null;
    const updatedGlobalScores = { ...currentGlobalScores };

    // Sort the scores obtained in this round according to the notion of "performance" in this round
    // For most rounds, the most performant team is the one with the highest score, but on error-based rounds it is the opposite (e.g., odd one out, matching)
    // Here we calculate the UNIQUE scores, i.e., we remove the duplicates which appear when several teams have the same score
    // Result: sortedUniqueRoundScores = [score1, score2, ...]
    const sortedUniqueRoundScores = sortScores(roundScores, sortAscendingRoundScores(roundType));

    /* ================================ Update the global scores of each team according to their performance in this round ================================ */
    const roundScorePolicy = game.roundScorePolicy;
    if (roundScorePolicy === ScorePolicyType.COMPLETION_RATE) {
      const gameQuestions = await Promise.all(
        questionIds.map((id: string) => gameQuestionRepo.getQuestionTransaction(transaction, id))
      );
      if (!gameQuestions) {
        this.log.warn({ round: roundId }, 'Game questions not found when ending round');
        throw new Error('Game questions not found when ending round');
      }

      // Score policy: calculate the "completion rate" of each team w.r.t. the maximum number of points of the round
      // This rate (min 0, max 100) is the score that is added to the global score of the team
      // This policy better reflects the performance of each team in the round

      // Aggregates teams that have obtained the same score in this round
      // Result: roundSortedTeams = [{score: score1, teams: [teamId1, teamId2, ...]}, {score: score2, teams: [teamId3, teamId4, ...]}, ...]
      roundSortedTeams = aggregateTiedTeams(sortedUniqueRoundScores, roundScores);

      if (!([RoundType.ODD_ONE_OUT, RoundType.MATCHING] as string[]).includes(roundType)) {
        // Add the calculated rates to the global scores of each team
        const updateGlobalScores = (completionRates: Record<string, number>) => {
          Object.keys(completionRates).forEach((teamId) => {
            (updatedGlobalScores as Scores)[teamId] =
              ((updatedGlobalScores as Scores)[teamId] || 0) + completionRates[teamId];
          });
        };

        if (([RoundType.MCQ, RoundType.NAGUI] as string[]).includes(roundType)) {
          // Aggregate team stats
          const teamStats = (gameQuestions as AnyGameQuestion[]).reduce(
            (acc: Record<string, { sumRewards: number; numQuestions: number }>, q: any) => {
              if (!q?.teamId) return acc;
              if (!acc[q.teamId]) {
                acc[q.teamId] = { sumRewards: 0, numQuestions: 0 };
              }
              acc[q.teamId].sumRewards += q.reward ?? 0;
              acc[q.teamId].numQuestions += 1;
              return acc;
            },
            {}
          );

          // Calculate the completion rate (in %) of each team
          roundCompletionRates = Object.entries(teamStats).reduce(
            (acc: Record<string, number>, [teamId, { sumRewards, numQuestions }]) => {
              const maxPoints =
                roundType === RoundType.NAGUI
                  ? numQuestions * (rewardsPerQuestion as any)['hide']
                  : numQuestions * rewardsPerQuestion;

              acc[teamId] = maxPoints > 0 ? Math.round((100 * sumRewards) / maxPoints) : 0;
              return acc;
            },
            {}
          );

          this.log.debug({ teamStats }, 'Team stats');

          updateGlobalScores(roundCompletionRates);
        } else {
          // Calculate the completion rate (in %) of each team
          const calculateCompletionRates = (maxPoints: number) => {
            const scores = roundScores as Scores;
            return Object.keys(scores).reduce((points: Scores, teamId) => {
              points[teamId] = maxPoints > 0 ? Math.round((100 * scores[teamId]) / maxPoints) : 0;
              return points;
            }, {});
          };

          const maxPoints = round.maxPoints!;
          roundCompletionRates = calculateCompletionRates(maxPoints);
          updateGlobalScores(roundCompletionRates);
        }
      }
    } else if (roundScorePolicy === ScorePolicyType.RANKING) {
      // Score policy: independently of the performance of each team in the round:
      // - the most performant team(s) get(s) the highest reward
      // - the second most performant team(s) get(s) the second highest reward,
      // - ... and so on
      // - If no reward is defined for a given position, the team(s) at this position get 0
      // This reward is the score that is added to the global score of the team

      // Array defining the reward-position pairs
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { rewards: roundRewards } = round as any; // e.g., [3, 2, 1]
      const scores = roundScores as Scores;
      const globalScores = updatedGlobalScores as Scores;

      // Aggregates teams with the same score in this round
      roundSortedTeams = sortedUniqueRoundScores.map((score: number, index: number) => {
        const tiedTeams = Object.keys(scores).filter((teamId) => scores[teamId] === score);
        const shuffledTiedTeams = shuffle(tiedTeams);
        const reward = index < (roundRewards as unknown[]).length ? roundRewards[index] : 0;
        tiedTeams.forEach((teamId) => (globalScores[teamId] = (globalScores[teamId] || 0) + reward));
        return { score, reward, teams: shuffledTiedTeams };
      });
    }

    // The "running order" for the next round prioritizes teams in reverse order of their performance in the current round.
    // The first team in the array - i.e., the least performant (or one of the least performant) - will choose the next round
    // Result: newChooserOrder = [teamId1, teamId2, ...]
    // Because the "tied teams" (i.e., teams with the same score) were shuffled, flattening the array implicitly randomizes the order of teams with the same score.
    // For example, if "TeamA" and "TeamC" are the two least performant teams for this round, the new running order could be ["TeamA", "TeamC", "TeamB"] or ["TeamC", "TeamA", "TeamB"].
    newChooserOrder = roundSortedTeams!
      .slice()
      .reverse()
      .flatMap(({ teams }) => shuffle(teams));

    /* ================================================ ROUND PROGRESS ================================================ */

    // Fills the missing scores for each team in this round
    // Indeed, a team may not have won any points in several questions
    // Result: filledRoundProgress = {team1: {question1: score1, question2: score2, ...}, team2: {question1: score1, question2: score2, ...}, ...}
    const filledRoundProgress: Record<string, Record<string, unknown>> = {};
    Object.keys(roundScores).forEach((teamId) => {
      const teamRoundProgress = (currRoundScoresProgress[teamId] || {}) as Record<string, unknown>;
      const teamScores: Record<string, unknown> = {};
      for (const [idx, questionId] of (questionIds as string[]).entries()) {
        const scoreAtQuestion = teamRoundProgress[questionId] || null;
        if (scoreAtQuestion != null) {
          teamScores[questionId] = scoreAtQuestion;
          continue;
        }
        if (idx === 0) {
          teamScores[questionId] = 0;
          continue;
        }
        const previousQuestionId = (questionIds as string[])[idx - 1];
        teamScores[questionId] = teamScores[previousQuestionId];
      }
      filledRoundProgress[teamId] = teamScores;
    });

    // Derives the "sequence of scores" of each team in the round, which describes the points accumulated in the round, question by question
    // This element is useful only for visualization purposes in the summary shown at the end of the round
    // Result: teamsScoresSequences = {team1: [score1, score2, ...], team2: [score1, score2, ...], ...}
    const teamsScoresSequences = Object.entries(filledRoundProgress).reduce(
      (acc: Record<string, unknown[]>, [teamId, teamProgress]) => {
        acc[teamId] = (questionIds as string[]).map((questionId) => teamProgress[questionId]);
        return acc;
      },
      {}
    );
    this.log.debug({ teamsScoresSequences }, 'Teams scores sequences');

    /* ================================================ GLOBAL PROGRESS ================================================ */

    // Sort the "global scores" accumulated so far in the overall game
    // As the goal for each team is to accumulate the most points in the game, the most performant team(s) is/are the one(s) with the highest score
    // Result: sortedUpdatedGameScores = [score1, score2, ...]
    const sortedUpdatedGameScores = sortScores(updatedGlobalScores as Scores, false);

    // Aggregates teams that have accumulated the same global score
    const gameSortedTeams = sortedUpdatedGameScores.map((score) => {
      const tiedTeams = Object.keys(updatedGlobalScores).filter((teamId) => updatedGlobalScores[teamId] === score);
      return { score, teams: tiedTeams };
    });

    // Updates the "progress" of global scores for each team by indicating the global score resulting from this round
    // Result: updatedGlobalScoresProgress = {team1: {round1: global_score1, round2: global_score2, ...}, team2: {round1: global_score1, round2: global_score2, ...}, ...}
    const updatedGlobalScoresProgress = Object.keys(updatedGlobalScores).reduce(
      (progress: Record<string, unknown>, teamId) => {
        progress[teamId] = {
          ...((currentGlobalScoresProgress[teamId] as Record<string, unknown>) || {}),
          [roundId]: updatedGlobalScores[teamId],
        };
        return progress;
      },
      {}
    );

    // Since the previous round (if any), the ranking of the teams w.r.t. the accumulated global scores may have changed
    // This element calculates the "ranking difference" of each team compared to the previous round, i.e., the difference in position in the ranking
    // This element is useful only for visualization purposes in the summary shown at the end of the round
    let rankingDiffs = null;
    if ((round.order ?? 0) > 0) {
      const prevRounds = await this.roundRepo.getRounds({
        where: {
          field: 'order',
          operator: '==',
          value: (round.order ?? 0) - 1,
        },
        limit: 1,
      });
      if (prevRounds.length === 0) {
        throw new Error('Previous round not found');
      }
      const prevRound = prevRounds[0];

      if (!prevRound) {
        this.log.warn({ round: roundId }, 'Previous round not found');
        throw new Error('Previous round not found');
      }
      this.log.debug({ prevRound }, 'Previous round');

      const prevRoundScoreRepo = new RoundScoreRepository(this.gameId, prevRound.id as string);
      const prevRoundScores = await prevRoundScoreRepo.getScoresTransaction(transaction);
      if (!prevRoundScores) {
        this.log.warn({ round: roundId }, 'Previous round scores not found');
        throw new Error('Previous round scores not found');
      }

      rankingDiffs = Round.calculateRankDifferences(prevRoundScores!.gameSortedTeams, gameSortedTeams);
    }

    /* =================================== WRITES =================================== */
    await roundScoreRepo.updateScoresTransaction(transaction, {
      roundSortedTeams,
      gameSortedTeams,
      rankingDiffs,
      scoresProgress: filledRoundProgress,
      teamsScoresSequences,
      ...(roundCompletionRates !== null && { roundCompletionRates }),
    });
    await this.gameScoreRepo.updateScoresTransaction(transaction, {
      scores: updatedGlobalScores,
      scoresProgress: updatedGlobalScoresProgress,
    });

    // If the round is not the last one, update the running order of teams for the next round
    if ((round.order ?? 0) < game.rounds.length - 1) {
      this.log.debug({ round: roundId, newChooserOrder }, 'Updating chooser order for the next round');
      // The first team in the running order - the "chooser" team - chooses the next round, hence the status 'focus'
      // All other teams are set to 'idle'
      const playersCollectionRef = collection(GAMES_COLLECTION_REF, this.gameId, 'players');
      for (const [idx, teamId] of newChooserOrder.entries()) {
        const playersSnapshot = await getDocs(query(playersCollectionRef, where('teamId', '==', teamId)));
        for (const playerDoc of playersSnapshot.docs) {
          await this.playerRepo.updatePlayerStatusTransaction(
            transaction,
            playerDoc.id,
            idx === 0 ? PlayerStatus.FOCUS : PlayerStatus.IDLE
          );
        }
      }
      await this.chooserRepo.updateChooserTransaction(transaction, {
        chooserIdx: 0,
        chooserOrder: newChooserOrder,
      });
    } else {
      this.log.debug({ round: roundId }, 'Last round ended, updating game scores');
      await this.gameScoreRepo.updateScoresTransaction(transaction, {
        gameSortedTeams,
      });
    }

    await this.readyRepo.resetReadyTransaction(transaction);
    await this.roundRepo.endRoundTransaction(transaction, roundId);
    await this.gameRepo.updateGameStatusTransaction(transaction, this.gameId, GameStatus.ROUND_END);
    await this.soundRepo.addSoundTransaction(transaction, 'level_passed');
    await this.timerRepo.resetTimerTransaction(transaction);
  }

  /**
   * game_home -> round_start
   * Switch to the round that has been selected by the chooser
   */
  async handleRoundSelected(roundId: string, userId: string) {
    if (!roundId) {
      throw new Error('Round ID is required');
    }
    if (!userId) {
      throw new Error('User ID is required');
    }

    try {
      await runTransaction(
        firestore,
        async (transaction) => await this.handleRoundSelectedTransaction(transaction, roundId, userId)
      );
    } catch (error) {
      this.log.error({ err: error }, 'Error handling round selected');
      throw error;
    }
  }

  async handleRoundSelectedTransaction(transaction: Transaction, roundId: string, userId: string) {
    throw new Error('Not implemented');
  }

  /* =============================================================================================================== */

  async calculateMaxPointsTransaction(transaction: Transaction, round: AnyRound): Promise<number> {
    throw new Error('Not implemented');
  }
}
