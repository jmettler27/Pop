import GameRepository from '@/backend/repositories/game/GameRepository';
import PlayerRepository from '@/backend/repositories/user/PlayerRepository';
import TeamRepository from '@/backend/repositories/user/TeamRepository';
import ReadyRepository from '@/backend/repositories/user/ReadyRepository';
import UserRepository from '@/backend/repositories/user/UserRepository';

import { PlayerStatus } from '@/backend/models/users/Player';
import { firestore } from '@/backend/firebase/firebase';

import { runTransaction, serverTimestamp } from 'firebase/firestore';

export default class JoinGameService {
  constructor(gameId) {
    this.gameId = gameId;
    if (!this.gameId) {
      throw new Error('Game ID is required');
    }

    this.userRepo = new UserRepository(gameId);
    this.gameRepo = new GameRepository();
    this.playerRepo = new PlayerRepository(gameId);
    this.teamRepo = new TeamRepository(gameId);
    this.readyRepo = new ReadyRepository(gameId);
  }

  async joinGame(userId, data) {
    if (!userId) {
      throw new Error('User ID is required');
    }
    if (!data) {
      throw new Error('Data is required');
    }

    try {
      await runTransaction(firestore, async (transaction) => {
        const user = await this.userRepo.getUserTransaction(transaction, userId);
        if (!user) {
          throw new Error('User not found');
        }

        if (!data.playInTeams) {
          console.log('JOIN SOLO', data);
          // Single player
          const team = await this.teamRepo.createTeamTransaction(transaction, {
            color: data.teamColor,
            name: data.playerName,
            teamAllowed: false,
            createdBy: userId,
            createdAt: serverTimestamp(),
          });
          data.teamId = team.id;
        } else if (!data.joinTeam) {
          console.log('JOIN TEAM', data);
          // Player that creates a new team
          const team = await this.teamRepo.createTeamTransaction(transaction, {
            color: data.teamColor,
            name: data.teamName,
            teamAllowed: true,
            createdBy: userId,
            createdAt: serverTimestamp(),
          });
          data.teamId = team.id;
        }

        // In any case: create player
        await this.playerRepo.createPlayerTransaction(
          transaction,
          {
            image: user.image,
            name: data.playerName,
            status: PlayerStatus.IDLE,
            teamId: data.teamId,
            joinedAt: serverTimestamp(),
          },
          userId
        );

        // Increment the number of players
        await this.readyRepo.incrementReadyTransaction(transaction);
      });
    } catch (error) {
      console.error('Error joining game:', error);
      throw error;
    }
  }
}
