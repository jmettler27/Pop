import RoundRepositoryFactory from '@/backend/repositories/round/RoundRepositoryFactory';
import GameRepository from '@/backend/repositories/game/GameRepository';
import PlayerRepository from '@/backend/repositories/user/PlayerRepository';
import TimerRepository from '@/backend/repositories/timer/TimerRepository';
import SoundRepository from '@/backend/repositories/sound/SoundRepository';
import TeamRepository from '@/backend/repositories/user/TeamRepository';
import ChooserRepository from '@/backend/repositories/user/ChooserRepository';
import ReadyRepository from '@/backend/repositories/user/ReadyRepository';
import RoundScoreRepository from '@/backend/repositories/score/RoundScoreRepository';
import GameScoreRepository from '@/backend/repositories/score/GameScoreRepository';
import BaseQuestionRepositoryFactory from '@/backend/repositories/question/base/BaseQuestionRepositoryFactory';
import GameQuestionRepositoryFactory from '@/backend/repositories/question/game/GameQuestionRepositoryFactory';
import GameQuestionServiceFactory from '@/backend/services/question/GameQuestionServiceFactory';

import { Round } from '@/backend/models/rounds/Round';
import { RoundType } from '@/backend/models/rounds/RoundType';
import { ScorePolicyType } from '@/backend/models/ScorePolicy';
import { GameStatus } from '@/backend/models/games/GameStatus';
import { PlayerStatus } from '@/backend/models/users/Player';

import { aggregateTiedTeams, shuffle } from '@/backend/utils/arrays';
import { sortAscendingRoundScores } from '@/backend/utils/rounds';
import { sortScores } from '@/backend/utils/scores';

import { GAMES_COLLECTION_REF } from '@/backend/firebase/firestore';
import { firestore } from '@/backend/firebase/firebase';
import { collection, getDocs, query, runTransaction, where } from 'firebase/firestore';

export default class RoundService {
  constructor(gameId, roundType) {
    if (!gameId) {
      throw new Error('Game ID is required');
    }
    if (!roundType) {
      throw new Error('Round type is required');
    }

    this.gameId = gameId;
    this.gameRepo = new GameRepository();
    this.gameScoreRepo = new GameScoreRepository(this.gameId);

    this.playerRepo = new PlayerRepository(this.gameId);
    this.teamRepo = new TeamRepository(this.gameId);
    this.chooserRepo = new ChooserRepository(this.gameId);
    this.timerRepo = new TimerRepository(this.gameId);
    this.soundRepo = new SoundRepository(this.gameId);
    this.readyRepo = new ReadyRepository(this.gameId);

    this.roundType = roundType;
    this.roundRepo = RoundRepositoryFactory.createRepository(this.gameId, this.roundType);

    this.baseQuestionRepo = BaseQuestionRepositoryFactory.createRepository(this.roundType);
    // this.gameQuestionRepo = GameQuestionRepositoryFactory.createRepository(this.roundType, this.gameId);
  }

  async resetRound(roundId) {
    const gameQuestionService = GameQuestionServiceFactory.createService(this.roundType, this.gameId, roundId);
    const gameQuestionRepo = GameQuestionRepositoryFactory.createRepository(this.roundType, this.gameId, roundId);
    const roundScoreRepo = new RoundScoreRepository(this.gameId, roundId);

    const questions = await gameQuestionRepo.getAllQuestions();
    const initTeamRoundScores = await this.getInitTeamScores();

    for (const question of questions) {
      await gameQuestionService.resetQuestion(question.id);
    }
    await roundScoreRepo.resetScores(initTeamRoundScores);
    await this.roundRepo.resetRound(roundId, this.roundType);
  }

  async getInitTeamScores() {
    const teams = await this.teamRepo.getAllTeams();
    return Object.fromEntries(teams.map((t) => [t.id, 0]));
  }

  // async resetRoundTransaction(transaction, roundId) {
  //   const gameQuestionService = GameQuestionServiceFactory.createService(this.roundType, this.gameId, roundId);
  //   const gameQuestionRepo = GameQuestionRepositoryFactory.createRepository(this.roundType, this.gameId, roundId);
  //   const roundScoreRepo = new RoundScoreRepository(this.gameId, roundId);
  //
  //   const questions = await gameQuestionRepo.getAllQuestions();
  //   const initTeamRoundScores = await this.getInitTeamScores();
  //
  //   for (const question of questions) {
  //     await gameQuestionService.resetQuestionTransaction(transaction, question.id);
  //   }
  //   await roundScoreRepo.resetScoresTransaction(transaction, initTeamRoundScores);
  //   await this.roundRepo.resetRoundTransaction(transaction, roundId, this.roundType);
  // }
  //
  // async getInitTeamScores() {
  //   const teams = await this.teamRepo.getAllTeams();
  //   return Object.fromEntries(teams.map((t) => [t.id, 0]));
  // }

  /**
   * round_start -> question_active
   */
  async startRound() {
    try {
      await runTransaction(firestore, (transaction) => startRoundTransaction(transaction));
    } catch (error) {
      console.error('Error starting round:', error);
      throw error;
    }
  }

  async startRoundTransaction(transaction, roundId) {
    await this.moveToNextQuestionTransaction(transaction, roundId, 0);

    console.log('Round successfully started', 'game', this.gameId, 'round', roundId);
  }

  async moveToNextQuestionTransaction(transaction, roundId, questionOrder) {
    throw new Error('Not implemented');
  }

  /**
   * question_end -> question_active or
   * question_end -> round_end
   */
  async handleQuestionEnd(roundId, questionId) {
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
      console.error('Error handling question end:', error);
      throw error;
    }
  }

  async handleQuestionEndTransaction(transaction, roundId, questionId) {
    const round = await this.roundRepo.getRoundTransaction(transaction, roundId);
    const isRoundOver = round.currentQuestionIdx === round.questions.length - 1;

    isRoundOver
      ? await this.endRoundTransaction(transaction, roundId)
      : await this.roundRepo.moveToNextQuestionTransaction(transaction, roundId, round.currentQuestionIdx + 1);
    // const round = await this.roundRepo.getRound(roundId)
    // await (round.isLastQuestion() ?
    //         this.endRoundTransaction(transaction) : /* End of round */
    //         this.moveToNextQuestionTransaction(transaction, round.currentQuestionIdx + 1) /* Prepare the next question */
    // )
  }

  /**
   * question_end -> round_end
   */
  async endRound(roundId) {
    if (!roundId) {
      throw new Error('Round ID is required');
    }

    try {
      await runTransaction(firestore, async (transaction) => await this.endRoundTransaction(transaction, roundId));
    } catch (error) {
      console.error('Error ending round:', error);
      throw error;
    }
  }

  async endRoundTransaction(transaction, roundId) {
    const game = await this.gameRepo.getGame(this.gameId);
    const round = await this.roundRepo.getRound(roundId);

    const gameScoresData = await this.gameScoreRepo.getScores(this.gameId);
    const roundScoresData = await this.roundScoreRepo.getScores(roundId);

    const roundScorePolicy = game.roundScorePolicy;

    const currentGlobalScores = gameScoresData.scores;
    const currentGlobalScoresProgress = gameScoresData.scoresProgress;

    const roundScores = roundScoresData.scores;
    const currRoundScoresProgress = roundScoresData.scoresProgress;

    // currentGlobalScores:         {team1: globalScore1, team2: globalScore2, ...}
    // currentGlobalScoresProgress: {
    //                                  team1: {round1: global score accumulated at the end of round1, round2: global score accumulated at the end of round2},
    //                                  team2: {round1: global score accumulated at the end of round1, round2:global score accumulated at the end of round2},
    //                              ...}
    const questionIds = round.questions;
    const roundType = round.type;
    const rewardsPerQuestion = round.rewardsPerQuestion;

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
    if (roundScorePolicy === ScorePolicyType.COMPLETION_RATE) {
      const gameQuestions = await Promise.all(
        questionIds.map((id) => this.gameQuestionRepo.getGameQuestionTransaction(transaction, id))
      );

      // Score policy: calculate the "completion rate" of each team w.r.t. the maximum number of points of the round
      // This rate (min 0, max 100) is the score that is added to the global score of the team
      // This policy better reflects the performance of each team in the round

      // Aggregates teams that have obtained the same score in this round
      // Result: roundSortedTeams = [{score: score1, teams: [teamId1, teamId2, ...]}, {score: score2, teams: [teamId3, teamId4, ...]}, ...]
      roundSortedTeams = aggregateTiedTeams(sortedUniqueRoundScores, roundScores);

      if (![RoundType.ODD_ONE_OUT, RoundType.MATCHING, RoundType.SPECIAL].includes(roundType)) {
        // Add the calculated rates to the global scores of each team
        const updateGlobalScores = (completionRates) => {
          Object.keys(completionRates).forEach((teamId) => {
            updatedGlobalScores[teamId] = (updatedGlobalScores[teamId] || 0) + completionRates[teamId];
          });
        };

        if ([RoundType.MCQ, RoundType.NAGUI].includes(roundType)) {
          // Aggregate team stats
          const teamStats = gameQuestions.reduce((acc, { teamId, reward }) => {
            if (!acc[teamId]) {
              acc[teamId] = { sumRewards: 0, numQuestions: 0 };
            }
            acc[teamId].sumRewards += reward;
            acc[teamId].numQuestions += 1;
            return acc;
          }, {});

          // Calculate the completion rate (in %) of each team
          roundCompletionRates = Object.entries(teamStats).reduce((acc, [teamId, { sumRewards, numQuestions }]) => {
            const maxPoints =
              roundType === RoundType.NAGUI
                ? numQuestions * rewardsPerQuestion['hide']
                : numQuestions * rewardsPerQuestion;

            acc[teamId] = maxPoints > 0 ? Math.round((100 * sumRewards) / maxPoints) : 0;
            return acc;
          }, {});

          console.log(teamStats);

          updateGlobalScores(roundCompletionRates);
        } else {
          // Calculate the completion rate (in %) of each team
          const calculateCompletionRates = (maxPoints) => {
            return Object.keys(roundScores).reduce((points, teamId) => {
              points[teamId] = maxPoints > 0 ? Math.round((100 * roundScores[teamId]) / maxPoints) : 0;
              return points;
            }, {});
          };

          const { maxPoints } = round;
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
      const { rewards: roundRewards } = round; // e.g., [3, 2, 1]

      // Aggregates teams with the same score in this round
      // At the same time, assign the reward accordingly
      // Result: roundSortedTeams = [{score: score1, reward: reward1, teams: [teamId1, teamId2, ...]}, {score: score2, reward: reward2, teams: [teamId3, teamId4, ...]},
      roundSortedTeams = sortedUniqueRoundScores.map((score, index) => {
        const tiedTeams = Object.keys(roundScores).filter((teamId) => roundScores[teamId] === score);
        const shuffledTiedTeams = shuffle(tiedTeams);
        const reward = index < roundRewards.length ? roundRewards[index] : 0;
        tiedTeams.forEach((teamId) => (updatedGlobalScores[teamId] = (updatedGlobalScores[teamId] || 0) + reward));
        return { score, reward, teams: shuffledTiedTeams };
      });
    }

    // The "running order" for the next round prioritizes teams in reverse order of their performance in the current round.
    // The first team in the array - i.e., the least performant (or one of the least performant) - will choose the next round
    // Result: newChooserOrder = [teamId1, teamId2, ...]
    // Because the "tied teams" (i.e., teams with the same score) were shuffled, flattening the array implicitly randomizes the order of teams with the same score.
    // For example, if "TeamA" and "TeamC" are the two least performant teams for this round, the new running order could be ["TeamA", "TeamC", "TeamB"] or ["TeamC", "TeamA", "TeamB"].
    newChooserOrder = roundSortedTeams
      .slice()
      .reverse()
      .flatMap(({ teams }) => shuffle(teams));

    /* ================================================ ROUND PROGRESS ================================================ */

    // Fills the missing scores for each team in this round
    // Indeed, a team may not have won any points in several questions
    // Result: filledRoundProgress = {team1: {question1: score1, question2: score2, ...}, team2: {question1: score1, question2: score2, ...}, ...}
    let filledRoundProgress = {};
    Object.keys(roundScores).forEach((teamId) => {
      const teamRoundProgress = currRoundScoresProgress[teamId] || {};
      let teamScores = {};
      for (const [idx, questionId] of questionIds.entries()) {
        const scoreAtQuestion = teamRoundProgress[questionId] || null;
        if (scoreAtQuestion != null) {
          teamScores[questionId] = scoreAtQuestion;
          continue;
        }
        if (idx === 0) {
          teamScores[questionId] = 0;
          continue;
        }
        const previousQuestionId = questionIds[idx - 1];
        teamScores[questionId] = teamScores[previousQuestionId];
      }
      filledRoundProgress[teamId] = teamScores;
    });

    // Derives the "sequence of scores" of each team in the round, which describes the points accumulated in the round, question by question
    // This element is useful only for visualization purposes in the summary shown at the end of the round
    // Result: teamsScoresSequences = {team1: [score1, score2, ...], team2: [score1, score2, ...], ...}
    const teamsScoresSequences = Object.entries(filledRoundProgress).reduce((acc, [teamId, teamProgress]) => {
      acc[teamId] = questionIds.map((questionId) => teamProgress[questionId]);
      return acc;
    }, {});

    /* ================================================ GLOBAL PROGRESS ================================================ */

    // Sort the "global scores" accumulated so far in the overall game
    // As the goal for each team is to accumulate the most points in the game, the most performant team(s) is/are the one(s) with the highest score
    // Result: sortedUpdatedGameScores = [score1, score2, ...]
    const sortedUpdatedGameScores = sortScores(updatedGlobalScores, false);

    // Aggregates teams that have accumulated the same global score
    const gameSortedTeams = sortedUpdatedGameScores.map((score) => {
      const tiedTeams = Object.keys(updatedGlobalScores).filter((teamId) => updatedGlobalScores[teamId] === score);
      return { score, teams: tiedTeams };
    });

    // Updates the "progress" of global scores for each team by indicating the global score resulting from this round
    // Result: updatedGlobalScoresProgress = {team1: {round1: global_score1, round2: global_score2, ...}, team2: {round1: global_score1, round2: global_score2, ...}, ...}
    const updatedGlobalScoresProgress = Object.keys(updatedGlobalScores).reduce((progress, teamId) => {
      progress[teamId] = {
        ...currentGlobalScoresProgress[teamId],
        [roundId]: updatedGlobalScores[teamId],
      };
      return progress;
    }, {});

    // Since the previous round (if any), the ranking of the teams w.r.t. the accumulated global scores may have changed
    // This element calculates the "ranking difference" of each team compared to the previous round, i.e., the difference in position in the ranking
    // This element is useful only for visualization purposes in the summary shown at the end of the round
    let rankingDiffs = null;
    if (round.order > 0) {
      const prevRound = await this.roundRepo.getRoundsTransaction({
        where: {
          field: 'order',
          operator: '==',
          value: round.order - 1,
        },
        limit: 1,
      })[0];
      const prevRoundScoreRepo = new RoundScoreRepository(this.gameId, prevRound.id);
      const prevRoundScores = await prevRoundScoreRepo.getScoresTransaction(transaction);

      rankingDiffs = Round.calculateRankDifferences(prevRoundScores.gameSortedTeams, gameSortedTeams);
    }

    /* =================================== WRITES =================================== */
    await this.roundScoreRepo.updateScoresTransaction(transaction, {
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
    if (round.order < gameData.rounds.length - 1) {
      // The first team in the running order - the "chooser" team - chooses the next round, hence the status 'focus'
      // All other teams are set to 'idle'
      const playersCollectionRef = collection(GAMES_COLLECTION_REF, gameId, 'players');
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
      await this.gameScoreRepo.updateGameScoresTransaction(transaction, {
        gameSortedTeams,
      });
    }

    await this.readyRepo.resetReadyTransaction(transaction);
    await this.roundRepo.startRoundTransaction(transaction, roundId);
    await this.gameRepo.updateGameStatusTransaction(transaction, GameStatus.ROUND_END);
    await this.soundRepo.addSoundTransaction(transaction, 'level-passed');
    await this.timerRepo.resetTimerTransaction(transaction);
  }

  /**
   * game_home -> round_start
   * Switch to the round that has been selected by the chooser
   */
  async handleRoundSelected(roundId, userId) {
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
      console.error('Error handling round selected:', error);
      throw error;
    }
  }

  async handleRoundSelectedTransaction(transaction, roundId, userId) {
    throw new Error('Not implemented');
    // const round = await this.roundRepo.getRoundTransaction(transaction, roundId)
    // const chooser = await this.chooserRepo.getChooserTransaction(transaction, this.chooserId)
    // const game = await this.gameRepo.getGameTransaction(transaction, this.gameId)
    //
    // const { type: roundType, questions: questionIds, rewardsPerQuestion, rewardsForBonus, rewardsPerElement } = round
    // const { roundScorePolicy, currentRound, currentQuestion } = game
    //
    //
    // let prevOrder = -1
    // if (currentRound !== null) {
    //     const prevRound = await this.roundRepo.getRoundTransaction(transaction, currentRound)
    //     prevOrder = prevRound.order
    // }
    // const newOrder = prevOrder + 1
    //
    // let maxPoints = null
    // if (roundScorePolicy === ScorePolicyType.COMPLETION_RATE) {
    //     maxPoints = await this.calculateMaxPointsTransaction(transaction, round)
    // }
    //
    // if (round.dateStart && !round.dateEnd && currentQuestion) {
    //     await this.gameRepo.updateGameStatusTransaction(transaction, this.gameId, GameStatus.QUESTION_ACTIVE)
    //     return
    // }
    //
    // if (isBuzzer(roundType) || [RoundType.QUOTE, RoundType.LABELLING, RoundType.ENUMERATION, RoundType.MIXED].includes(roundType)) {
    //     // Set the status of every player to 'idle'
    //     const playersCollectionRef = collection(GAMES_COLLECTION_REF, this.gameId, 'players')
    //     const playersSnapshot = await getDocs(query(playersCollectionRef))
    //
    //     for (const playerDoc of playersSnapshot.docs) {
    //         await this.playerRepo.updatePlayerStatusTransaction(transaction, playerDoc.id, PlayerStatus.IDLE)
    //     }
    // }
    //
    // if (roundType === RoundType.MCQ || roundType === RoundType.NAGUI) {
    //     const shuffledQuestionIds = shuffle(questionIds)
    //     await this.roundRepo.updateRoundTransaction(transaction, {
    //         questions: shuffledQuestionIds
    //     })
    // }
    //
    // await this.roundRepo.updateRoundTransaction(transaction, roundId, {
    //     dateStart: serverTimestamp(),
    //     order: newOrder,
    //     ...(roundType !== RoundType.SPECIAL ? { currentQuestionIdx: 0 } : {}),
    //     ...(maxPoints !== null && { maxPoints })
    // })
    //
    //
    // // If the round requires an order of chooser teams (e.g. OOO, MCQ) and it is the first round, find a random order for the chooser teams
    // if (chooser.chooserOrder.length === 0 || chooser.chooserIdx === null) {
    //     const teamsCollectionRef = collection(GAMES_COLLECTION_REF, gameId, 'teams')
    //     const teamsSnapshot = await getDocs(query(teamsCollectionRef))
    //     const teamIds = teamsSnapshot.docs.map(doc => doc.id)
    //     // const teamIds = await this.teamRepo.getAllIdsTransaction(transaction)
    //
    //     await this.chooserRepo.updateChooserTransaction(transaction, {
    //         chooserOrder: shuffle(teamIds),
    //     })
    // }
    //
    // await this.chooserRepo.updateChooserTransaction(transaction, {
    //     chooserIdx: 0,
    // })
    //
    // await this.timerRepo.updateTimerTransaction(transaction, {
    //     status: TimerStatus.RESET,
    //     duration: Timer.READY_COUNTDOWN_SECONDS,
    //     authorized: false
    // })
    //
    // await this.soundRepo.addSoundTransaction(transaction, 'super_mario_odyssey_moon')
    //
    // await this.gameRepo.updateGameTransaction(transaction, {
    //     currentRound: roundId,
    //     currentQuestion: null,
    //     status: GameStatus.ROUND_START
    // })
    //
    // console.log('Round successfully started', 'game', this.gameId,  'round', roundId)
  }

  /* =============================================================================================================== */

  async calculateMaxPointsTransaction(transaction, round) {
    throw new Error('Not implemented');
  }

  async prepareQuestionStartTransaction(transaction, questionId, questionOrder) {
    throw new Error('Not implemented');
  }
}
