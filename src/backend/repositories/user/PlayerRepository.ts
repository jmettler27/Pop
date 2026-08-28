import { type Transaction } from 'firebase-admin/firestore';

import FirebaseRepository from '@/backend/repositories/FirebaseRepository';
import { adminDb } from '@/firebase/admin';
import { Player, type PlayerData } from '@/models/users/player';

export default class PlayerRepository extends FirebaseRepository {
  constructor(gameId: string) {
    super(['games', gameId, 'players']);
  }

  async getPlayer(playerId: string): Promise<Player | null> {
    const data = await super.get(playerId);
    return data ? new Player(data as unknown as PlayerData) : null;
  }

  async getPlayerTransaction(transaction: Transaction, playerId: string): Promise<Player | null> {
    const data = await this.getTransaction(transaction, playerId);
    return data ? new Player(data as unknown as PlayerData) : null;
  }

  async getAllPlayers(): Promise<Player[]> {
    const data = await super.getAll();
    return data.map((p) => new Player(p as unknown as PlayerData));
  }

  async getAllPlayerIds(): Promise<string[]> {
    const data = await super.getAll();
    return data.map((p) => p.id as string);
  }

  async getPlayersByTeamId(teamId: string): Promise<Player[]> {
    const data = await super.getByField('teamId', teamId);
    return data.map((p) => new Player(p as unknown as PlayerData));
  }

  async getPlayersByTeamIdTransaction(transaction: Transaction, teamId: string): Promise<Player[]> {
    const data = await super.getByFieldTransaction(transaction, 'teamId', teamId);
    return data.map((p) => new Player(p as unknown as PlayerData));
  }

  async getAllOtherPlayers(teamId: string): Promise<Player[]> {
    const data = await super.getByQuery({ where: { field: 'teamId', operator: '!=', value: teamId } });
    return data.map((p) => new Player(p as unknown as PlayerData));
  }

  async getAllOtherPlayersTransaction(transaction: Transaction, teamId: string): Promise<Player[]> {
    const data = await super.getByQueryTransaction(transaction, {
      where: { field: 'teamId', operator: '!=', value: teamId },
    });
    return data.map((p) => new Player(p as unknown as PlayerData));
  }

  async createPlayer(data: PlayerData, playerId: string | null = null): Promise<Player> {
    if (!data.name) throw new Error('Player name is required');
    const createdData = await super.create(data as unknown as Record<string, unknown>, playerId);
    return new Player(createdData as unknown as PlayerData);
  }

  async createPlayerTransaction(
    transaction: Transaction,
    data: PlayerData,
    playerId: string | null = null
  ): Promise<Player> {
    if (!data.name) throw new Error('Player name is required');
    const createdData = await super.createTransaction(
      transaction,
      data as unknown as Record<string, unknown>,
      playerId
    );
    return new Player(createdData as unknown as PlayerData);
  }

  async updatePlayer(playerId: string, data: Record<string, unknown>): Promise<void> {
    await super.update(playerId, data);
  }

  async updatePlayerTransaction(
    transaction: Transaction,
    playerId: string,
    data: Record<string, unknown>
  ): Promise<void> {
    await super.updateTransaction(transaction, playerId, data);
  }

  async updatePlayerStatusTransaction(transaction: Transaction, playerId: string, status: string): Promise<void> {
    await this.updatePlayerTransaction(transaction, playerId, { status });
  }

  async updateAllPlayersStatus(status: string, playerIds: string[]): Promise<void> {
    const batch = adminDb().batch();
    playerIds.forEach((id: string) => batch.update(this.getDocumentRef(id), { status }));
    await batch.commit();
  }

  async updateAllPlayersStatusTransaction(
    transaction: Transaction,
    status: string,
    playerIds: string[]
  ): Promise<void> {
    playerIds.map((id: string) => this.getDocumentRef(id)).forEach((ref) => transaction.update(ref, { status }));
  }

  async updateTeamPlayersStatus(teamId: string, status: string): Promise<void> {
    const players = await this.getPlayersByTeamId(teamId);
    const batch = adminDb().batch();
    for (const player of players) batch.update(this.getDocumentRef(player.id!), { status });
    await batch.commit();
  }

  async updateTeamAndOtherTeamsPlayersStatus(
    teamId: string,
    teamStatus: string,
    otherTeamsStatus: string
  ): Promise<void> {
    const players = await this.getPlayersByTeamId(teamId);
    const otherPlayers = await this.getAllOtherPlayers(teamId);
    const batch = adminDb().batch();
    for (const player of players) batch.update(this.getDocumentRef(player.id!), { status: teamStatus });
    for (const player of otherPlayers) batch.update(this.getDocumentRef(player.id!), { status: otherTeamsStatus });
    await batch.commit();
  }
}
