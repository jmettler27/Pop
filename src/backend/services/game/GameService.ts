import { runTransaction, serverTimestamp, Timestamp } from 'firebase/firestore';
import type { Logger } from 'pino';

import { logger } from '@/backend/logger';
import GameRepository from '@/backend/repositories/game/GameRepository';
import RoundRepository from '@/backend/repositories/round/RoundRepository';
import GameScoreRepository from '@/backend/repositories/score/GameScoreRepository';
import SoundRepository from '@/backend/repositories/sound/SoundRepository';
import TimerRepository from '@/backend/repositories/timer/TimerRepository';
import ChooserRepository from '@/backend/repositories/user/ChooserRepository';
import OrganizerRepository from '@/backend/repositories/user/OrganizerRepository';
import PlayerRepository from '@/backend/repositories/user/PlayerRepository';
import ReadyRepository from '@/backend/repositories/user/ReadyRepository';
import TeamRepository from '@/backend/repositories/user/TeamRepository';
import RoundServiceFactory from '@/backend/services/round/RoundServiceFactory';
import { firestore } from '@/firebase/firebase';
import { type Locale } from '@/frontend/helpers/locales';
import { type GameRoundsData } from '@/models/games/game';
import { GameStatus } from '@/models/games/game-status';
import { type GameType } from '@/models/games/game-type';
import { Scores, ScoresProgress } from '@/models/scores';
import Team from '@/models/team';
import { PlayerStatus } from '@/models/users/player';
import { getRandomElement, shuffle } from '@/utils/arrays';

function serializeTimestamp(value: unknown): { seconds: number; nanoseconds: number } | null {
  return value instanceof Timestamp ? { seconds: value.seconds, nanoseconds: value.nanoseconds } : null;
}

export default class GameService {
  gameId: string;
  gameRepo: GameRepository;
  soundRepo: SoundRepository;
  chooserRepo: ChooserRepository;
  timerRepo: TimerRepository;
  readyRepo: ReadyRepository;
  gameScoreRepo: GameScoreRepository;
  teamRepo: TeamRepository;
  playerRepo: PlayerRepository;
  organizerRepo: OrganizerRepository;
  roundRepo: RoundRepository;
  private log: Logger;

  constructor(gameId: string) {
    if (!gameId) {
      throw new Error('No game ID has been provided!');
    }

    this.gameId = gameId;
    this.log = logger.child({ module: 'GameService', game: this.gameId });

    this.gameRepo = new GameRepository();
    this.soundRepo = new SoundRepository(gameId);
    this.chooserRepo = new ChooserRepository(gameId);
    this.timerRepo = new TimerRepository(gameId);
    this.readyRepo = new ReadyRepository(gameId);
    this.gameScoreRepo = new GameScoreRepository(gameId);
    this.teamRepo = new TeamRepository(gameId);
    this.playerRepo = new PlayerRepository(gameId);
    this.organizerRepo = new OrganizerRepository(gameId);
    this.roundRepo = new RoundRepository(gameId);
  }

  // game_start -> game_home
  /**
   * Starts a game
   */
  async startGame() {
    try {
      await runTransaction(firestore, async (transaction) => {
        const teams = await this.teamRepo.getAll();

        const { teamIds, initTeamGameScores, initTeamGameScoresProgress } = (teams as unknown as Team[]).reduce(
          (
            acc: {
              teamIds: string[];
              initTeamGameScores: Scores;
              initTeamGameScoresProgress: ScoresProgress;
            },
            team: Team
          ) => {
            acc.teamIds.push(team.id as string);
            acc.initTeamGameScores[team.id as string] = 0;
            acc.initTeamGameScoresProgress[team.id as string] = {};
            return acc;
          },
          { teamIds: [], initTeamGameScores: {}, initTeamGameScoresProgress: {} }
        );

        const shuffledTeamIds = shuffle(teamIds);
        const chooserTeamId = shuffledTeamIds[0];

        await this.playerRepo.updateTeamAndOtherTeamsPlayersStatus(
          chooserTeamId,
          PlayerStatus.FOCUS,
          PlayerStatus.IDLE
        );

        await this.gameRepo.updateGameTransaction(transaction, this.gameId, {
          status: GameStatus.GAME_HOME,
          dateStart: serverTimestamp(),
        });

        await this.chooserRepo.initializeChoosersTransaction(transaction, shuffledTeamIds);

        // await this.gameScoreRepo.initializeScoresTransaction(transaction, {
        //   scores: initTeamGameScores,
        //   scoresProgress: initTeamGameScoresProgress,
        // });

        await this.readyRepo.updateReadyTransaction(transaction, {
          numReady: 0,
        });

        await this.soundRepo.addSoundTransaction(transaction, 'ui_confirmation_alert_b2');

        await this.timerRepo.resetTimerTransaction(transaction);

        this.log.info('Game successfully started');
      });
    } catch (error) {
      this.log.error({ err: error }, 'Failed to start the game');
      throw error;
    }
  }

  async resetGame() {
    const teams = await this.teamRepo.getAllTeams();
    const playerIds = await this.playerRepo.getAllPlayerIds();
    const organizerIds = await this.organizerRepo.getAllOrganizerIds();

    const { teamIds, initTeamGameScores, initTeamGameScoresProgress } = teams.reduce(
      (
        acc: {
          teamIds: string[];
          initTeamGameScores: Scores;
          initTeamGameScoresProgress: ScoresProgress;
        },
        team: Team
      ) => {
        acc.teamIds.push(team.id as string);
        acc.initTeamGameScores[team.id as string] = 0;
        acc.initTeamGameScoresProgress[team.id as string] = {};
        return acc;
      },
      { teamIds: [], initTeamGameScores: {}, initTeamGameScoresProgress: {} }
    );

    // Init chooser
    const shuffledTeamIds = shuffle(teamIds);
    await this.chooserRepo.updateChooser({
      chooserIdx: 0,
      chooserOrder: shuffledTeamIds,
    });

    // Reset all rounds - assuming a method exists in gameRepo
    await this.resetAllRounds();

    // Reset game
    await this.gameRepo.resetGame(this.gameId);

    // Reset timer
    const managerId = getRandomElement(organizerIds);
    await this.timerRepo.initializeTimer(managerId);

    // Init global scores
    await this.gameScoreRepo.setScores({
      scores: initTeamGameScores,
      scoresProgress: initTeamGameScoresProgress,
    });

    await this.readyRepo.set({
      numPlayers: playerIds.length,
      numReady: 0,
    });

    await this.playerRepo.updateAllPlayersStatus(PlayerStatus.IDLE, playerIds);
    await this.soundRepo.clearSounds();

    this.log.info('Game successfully reset');
  }

  async resetAllRounds() {
    const rounds = await this.roundRepo.getAllRounds();

    for (const round of rounds) {
      this.log.debug({ roundId: round.id, roundType: round.type }, 'Resetting round');
      const roundService = RoundServiceFactory.createService(round.type!, this.gameId);
      await roundService.resetRound(round.id as string);
    }
  }

  /**
   * Switch to the game home
   *
   * round_end_game_hone
   */
  async returnToGameHome() {
    try {
      await runTransaction(firestore, async (transaction) => {
        await this.soundRepo.addSoundTransaction(transaction, 'ui_confirmation_alert_b2');
        await this.gameRepo.updateGameStatusTransaction(transaction, this.gameId, GameStatus.GAME_HOME);

        this.log.info('Round end to game home completed');
      });
    } catch (error) {
      this.log.error({ err: error }, 'Error round end to game home');
      throw error;
    }
  }

  /**
   * Resume editing
   */
  async resumeEditing() {
    try {
      await runTransaction(firestore, async (transaction) => {
        await this.gameRepo.updateGameStatusTransaction(transaction, this.gameId, GameStatus.GAME_EDIT);

        this.log.info('Editing resumed');
      });
    } catch (error) {
      this.log.error({ err: error }, 'Error resuming editing');
      throw error;
    }
  }

  /**
   * End a game
   */
  async endGame() {
    try {
      await runTransaction(firestore, async (transaction) => {
        await this.gameRepo.updateGameTransaction(transaction, this.gameId, {
          status: GameStatus.GAME_END,
          dateEnd: serverTimestamp(),
        });

        this.log.info('Game ended');
      });
    } catch (error) {
      this.log.error({ err: error }, 'Error ending game');
      throw error;
    }
  }

  /**
   * Retrieves all games with the given status where the user is an organizer or a player.
   *
   * A plain, serializable summary of each game is returned (server actions cannot cross the
   * client/server boundary with class instances or nested Firestore Timestamp objects).
   */
  static async getGamesForUserByStatus(status: string, userId: string): Promise<GameRoundsData[]> {
    const gameRepo = new GameRepository();
    const games = await gameRepo.getGamesByStatus(status);

    const results: GameRoundsData[] = [];
    for (const game of games) {
      const gameId = game.id as string;
      const organizerRepo = new OrganizerRepository(gameId);
      const playerRepo = new PlayerRepository(gameId);
      const [organizerIds, playerIds] = await Promise.all([
        organizerRepo.getAllOrganizerIds(),
        playerRepo.getAllPlayerIds(),
      ]);

      if (!organizerIds.includes(userId) && !playerIds.includes(userId)) continue;

      results.push({
        id: gameId,
        title: game.title as string,
        type: game.type as GameType,
        lang: game.lang as Locale,
        status: game.status as string,
        dateEnd: serializeTimestamp(game.dateEnd),
      });
    }

    results.sort((a, b) => {
      const aSeconds = (a.dateEnd as { seconds: number } | null)?.seconds ?? 0;
      const bSeconds = (b.dateEnd as { seconds: number } | null)?.seconds ?? 0;
      return bSeconds - aSeconds;
    });

    return results;
  }

  /**
   * Retrieves all ended games where the given user is an organizer or a player.
   */
  static async getEndedGamesForUser(userId: string): Promise<GameRoundsData[]> {
    return GameService.getGamesForUserByStatus(GameStatus.GAME_END, userId);
  }

  /**
   * Retrieves all games under construction where the given user is an organizer or a player.
   */
  static async getGamesUnderConstructionForUser(userId: string): Promise<GameRoundsData[]> {
    return GameService.getGamesForUserByStatus(GameStatus.GAME_EDIT, userId);
  }
}
