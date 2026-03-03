import { firestore } from '@/backend/firebase/firebase';
import { runTransaction, serverTimestamp } from 'firebase/firestore';

import GameRepository from '@/backend/repositories/game/GameRepository';
import TimerRepository from '@/backend/repositories/timer/TimerRepository';
import SoundRepository from '@/backend/repositories/sound/SoundRepository';
import ChooserRepository from '@/backend/repositories/user/ChooserRepository';
import ReadyRepository from '@/backend/repositories/user/ReadyRepository';
import GameScoreRepository from '@/backend/repositories/score/GameScoreRepository';
import TeamRepository from '@/backend/repositories/user/TeamRepository';
import RoundRepository from '@/backend/repositories/round/RoundRepository';
import PlayerRepository from '@/backend/repositories/user/PlayerRepository';
import OrganizerRepository from '@/backend/repositories/user/OrganizerRepository';

import { PlayerStatus } from '@/backend/models/users/Player';
import { GameStatus } from '@/backend/models/games/GameStatus';
import { TimerStatus } from '@/backend/models/Timer';
import { getRandomElement, shuffle } from '@/backend/utils/arrays';
import Error from '@/app/error';
import RoundServiceFactory from '@/backend/services/round/RoundServiceFactory';

export default class GameService {
  constructor(gameId) {
    if (!gameId) {
      throw new Error('No game ID has been provided!');
    }

    this.gameId = gameId;

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

        const { teamIds, initTeamGameScores, initTeamGameScoresProgress } = teams.reduce(
          (acc, team) => {
            acc.teamIds.push(team.id);
            acc.initTeamGameScores[team.id] = 0;
            acc.initTeamGameScoresProgress[team.id] = {};
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

        await this.soundRepo.addSoundTransaction(transaction, 'ui-confirmation-alert-b2');

        await this.timerRepo.resetTimerTransaction(transaction);

        console.log('Game successfully started.', 'game', this.gameId);
      });
    } catch (error) {
      console.error('Failed to start the game:', error);
      throw error;
    }
  }

  async resetGame() {
    const teams = await this.teamRepo.getAllTeams();
    const playerIds = await this.playerRepo.getAllPlayerIds();
    const organizerIds = await this.organizerRepo.getAllOrganizerIds();

    const { teamIds, initTeamGameScores, initTeamGameScoresProgress } = teams.reduce(
      (acc, team) => {
        acc.teamIds.push(team.id);
        acc.initTeamGameScores[team.id] = 0;
        acc.initTeamGameScoresProgress[team.id] = {};
        return acc;
      },
      { teamIds: [], initTeamGameScores: {}, initTeamGameScoresProgress: {} }
    );

    // Reset all rounds - assuming a method exists in gameRepo
    await this.resetAllRounds();

    // Reset game
    await this.gameRepo.resetGame(this.gameId);

    // Reset timer
    const managerId = getRandomElement(organizerIds);
    await this.timerRepo.update({
      status: TimerStatus.RESET,
      duration: 60,
      forward: false,
      authorized: false,
      managedBy: managerId,
    });

    // Init chooser
    const shuffledTeamIds = shuffle(teamIds);
    await this.chooserRepo.updateChooser({
      chooserIdx: 0,
      chooserOrder: shuffledTeamIds,
    });

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

    console.log('Game successfully reset', 'game', this.gameId);
  }

  async resetAllRounds() {
    const rounds = await this.roundRepo.getAllRounds();

    for (const round of rounds) {
      console.log('RESETTING ROUND', 'ID', round.id, 'TYPE', round.type);
      const roundService = RoundServiceFactory.createService(round.type, this.gameId);
      await roundService.resetRound(round.id);
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
        await this.soundRepo.addSoundTransaction(transaction, 'ui-confirmation-alert-b2');
        await this.gameRepo.updateGameStatusTransaction(transaction, this.gameId, GameStatus.GAME_HOME);

        console.log('Round end to game home successfully completed.', 'game', this.gameId);
      });
    } catch (error) {
      console.error('Error round end to game home:', error);
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

        console.log('Editing successfully resumed.', 'game', this.gameId);
      });
    } catch (error) {
      console.error('Error resuming editing:', error);
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

        console.log('Game successfully ended.', 'game', this.gameId);
      });
    } catch (error) {
      console.error('Error ending game:', error);
      throw error;
    }
  }
}
