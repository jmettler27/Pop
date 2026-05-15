import { doc, query, where, writeBatch, type Transaction } from 'firebase/firestore';

import { firestore } from '@/backend/firebase/firebase';
import FirebaseRepository from '@/backend/repositories/FirebaseRepository';
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
    const batch = writeBatch(firestore);
    playerIds.forEach((id) => batch.update(doc(this.collectionRef, id), { status }));
    await batch.commit();
  }

  async updateAllPlayersStatusTransaction(
    transaction: Transaction,
    status: string,
    playerIds: string[]
  ): Promise<void> {
    playerIds.map((id) => doc(this.collectionRef, id)).forEach((ref) => transaction.update(ref, { status }));
  }

  async updateTeamPlayersStatus(teamId: string, status: string): Promise<void> {
    const players = await this.getPlayersByTeamId(teamId);
    const batch = writeBatch(firestore);
    for (const player of players) batch.update(doc(this.collectionRef, player.id!), { status });
    await batch.commit();
  }

  async updateTeamAndOtherTeamsPlayersStatus(
    teamId: string,
    teamStatus: string,
    otherTeamsStatus: string
  ): Promise<void> {
    const players = await this.getPlayersByTeamId(teamId);
    const otherPlayers = await this.getAllOtherPlayers(teamId);
    const batch = writeBatch(firestore);
    for (const player of players) batch.update(doc(this.collectionRef, player.id!), { status: teamStatus });
    for (const player of otherPlayers) batch.update(doc(this.collectionRef, player.id!), { status: otherTeamsStatus });
    await batch.commit();
  }

  usePlayer(playerId: string) {
    const { data, loading, error } = super.useDocument(playerId);
    return { player: data ? new Player(data as unknown as PlayerData) : null, loading, error };
  }

  usePlayerOnce(id: string) {
    const { data, loading, error } = super.useDocumentOnce(id);
    return { player: data ? new Player(data as unknown as PlayerData) : null, loading, error };
  }

  usePlayerIdentityOnce(id: string) {
    const { data, loading, error } = super.useDocumentOnce(id);
    return { player: data ? { id: data.id, name: data.name, teamId: data.teamId } : null, loading, error };
  }

  useAllPlayerIdentitiesOnce() {
    const { data, loading, error } = super.useCollectionOnce();
    return {
      players: data.map((p) => ({ id: p.id as string, name: p.name as string, teamId: p.teamId as string })),
      loading,
      error,
    };
  }

  usePlayerStates() {
    const { data, loading, error } = super.useCollection();
    return { playerStates: data.map((p) => ({ id: p.id, status: p.status })), loading, error };
  }

  useAllPlayers() {
    const { data, loading, error } = super.useCollection();
    return { players: data.map((p) => new Player(p as unknown as PlayerData)), loading, error };
  }

  useAllPlayersOnce() {
    const { data, loading, error } = super.useCollectionOnce();
    return { players: data.map((p) => new Player(p as unknown as PlayerData)), loading, error };
  }

  useTeamPlayers(teamId: string) {
    const { data, loading, error } = super.useQuery((ref) => query(ref, where('teamId', '==', teamId)));
    return { players: data.map((p) => new Player(p as unknown as PlayerData)), loading, error };
  }

  usePlayersByStatus(status: string) {
    const { data, loading, error } = super.useQuery((ref) => query(ref, where('status', '==', status)));
    return { players: data.map((p) => new Player(p as unknown as PlayerData)), loading, error };
  }
}
