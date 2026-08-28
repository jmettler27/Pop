import { FieldValue } from 'firebase-admin/firestore';
import type { Logger } from 'pino';

import { logger } from '@/backend/logger';
import PlayerRepository from '@/backend/repositories/user/PlayerRepository';
import ReadyRepository from '@/backend/repositories/user/ReadyRepository';
import TeamRepository from '@/backend/repositories/user/TeamRepository';
import UserRepository from '@/backend/repositories/user/UserRepository';
import { adminDb } from '@/firebase/admin';
import { PlayerStatus } from '@/models/users/player';
import { generateAvatarUrl } from '@/utils/avatar';

export default class JoinGameService {
  private gameId: string;
  private userRepo: UserRepository;
  private playerRepo: PlayerRepository;
  private teamRepo: TeamRepository;
  private readyRepo: ReadyRepository;
  private log: Logger;

  constructor(gameId: string) {
    this.gameId = gameId;
    if (!this.gameId) {
      throw new Error('Game ID is required');
    }

    this.log = logger.child({ module: 'JoinGameService', game: this.gameId });
    this.userRepo = new UserRepository();
    this.playerRepo = new PlayerRepository(gameId);
    this.teamRepo = new TeamRepository(gameId);
    this.readyRepo = new ReadyRepository(gameId);
  }

  async joinGame(userId: string, data: any) {
    if (!userId) {
      throw new Error('User ID is required');
    }
    if (!data) {
      throw new Error('Data is required');
    }

    try {
      await adminDb().runTransaction(async (transaction) => {
        const user = await this.userRepo.getUserTransaction(transaction, userId);
        if (!user) {
          throw new Error('User not found');
        }

        if (!data.playInTeams) {
          this.log.debug({ data }, 'Join solo');
          // Single player
          const team = await this.teamRepo.createTeamTransaction(transaction, {
            color: data.teamColor,
            name: data.playerName,
            teamAllowed: false,
            createdBy: userId,
            createdAt: FieldValue.serverTimestamp(),
          });
          data.teamId = team.id;
        } else if (!data.joinTeam) {
          this.log.debug({ data }, 'Join team');
          // Player that creates a new team
          const team = await this.teamRepo.createTeamTransaction(transaction, {
            color: data.teamColor,
            name: data.teamName,
            teamAllowed: true,
            createdBy: userId,
            createdAt: FieldValue.serverTimestamp(),
          });
          data.teamId = team.id;
        }

        // In any case: create player
        await this.playerRepo.createPlayerTransaction(
          transaction,
          {
            image: user.image ?? generateAvatarUrl(userId),
            name: data.playerName,
            status: PlayerStatus.IDLE,
            teamId: data.teamId,
            joinedAt: FieldValue.serverTimestamp(),
          },
          userId
        );

        // Increment the number of players
        await this.readyRepo.incrementReadyTransaction(transaction);
      });
    } catch (error) {
      this.log.error({ err: error }, 'Error joining game');
      throw error;
    }
  }
}
