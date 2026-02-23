import FirebaseRepository from '@/backend/repositories/FirebaseRepository';
import { doc, query, where, writeBatch } from 'firebase/firestore';

import { Player } from '@/backend/models/users/Player';
import { firestore } from '@/backend/firebase/firebase';

export default class PlayerRepository extends FirebaseRepository {
  constructor(gameId) {
    super(['games', gameId, 'players']);
  }

  async getPlayer(playerId) {
    const data = await super.get(playerId);
    return data ? new Player(data) : null;
  }

  async getPlayerTransaction(transaction, playerId) {
    const data = await super.getTransaction(transaction, playerId);
    return data ? new Player(data) : null;
  }

  async getAllPlayers() {
    const data = await super.getAll();
    return data.map((p) => new Player(p));
  }

  async getAllPlayerIds() {
    const data = await super.getAll();
    return data.map((p) => p.id);
  }

  async getPlayersByTeamId(teamId) {
    const data = await super.getByField('teamId', teamId);
    return data.map((p) => new Player(p));
  }

  async getPlayersByTeamIdTransaction(transaction, teamId) {
    const data = await super.getByFieldTransaction(transaction, 'teamId', teamId);
    return data.map((p) => new Player(p));
  }

  async getAllOtherPlayers(teamId) {
    const data = await super.getByQuery({
      where: { field: 'teamId', operator: '!=', value: teamId },
    });
    return data.map((p) => new Player(p));
  }

  async getAllOtherPlayersTransaction(transaction, teamId) {
    const data = await super.getByQueryTransaction(transaction, {
      where: { field: 'teamId', operator: '!=', value: teamId },
    });
    return data.map((p) => new Player(p));
  }

  async createPlayer(data, playerId = null) {
    if (!data.name) {
      throw new Error('Player name is required');
    }
    const createdData = await super.create(data, playerId);
    return new Player(createdData);
  }

  async createPlayerTransaction(transaction, data, playerId = null) {
    if (!data.name) {
      throw new Error('Player name is required');
    }
    const createdData = await super.createTransaction(transaction, data, playerId);
    return new Player(createdData);
  }

  async updatePlayer(playerId, data) {
    await super.update(playerId, data);
  }

  async updatePlayerTransaction(transaction, playerId, data) {
    await super.updateTransaction(transaction, playerId, data);
  }

  async updatePlayerStatusTransaction(transaction, playerId, status) {
    await this.updatePlayerTransaction(transaction, playerId, { status });
  }

  async updateAllPlayersStatus(status, playerIds) {
    const batch = writeBatch(firestore);
    playerIds.forEach((id) => batch.update(doc(this.collectionRef, id), { status }));
    await batch.commit();
  }

  // async updateAllPlayersStatusTransaction(transaction, status) {
  //   const players = await super.getAll();
  //   for (const player of players) {
  //     await this.updatePlayerTransaction(transaction, player.id, { status });
  //   }
  // }

  async updateAllPlayersStatusTransaction(transaction, status, playerIds) {
    const playerRefs = playerIds.map((id) => doc(this.collectionRef, id));
    playerRefs.forEach((ref) => transaction.update(ref, { status }));
  }

  async updateTeamPlayersStatusTransaction(transaction, teamId, status) {
    const players = await this.getPlayersByTeamIdTransaction(transaction, teamId);
    for (const p of players) {
      await this.updatePlayerTransaction(transaction, p.id, { status });
    }
  }

  async updateTeamPlayersStatus(teamId, status) {
    const players = await this.getPlayersByTeamId(teamId);
    const batch = writeBatch(firestore);
    for (const player of players) {
      batch.update(doc(this.collectionRef, player.id), { status });
    }
    await batch.commit();
  }

  async updateTeamAndOtherTeamsPlayersStatus(teamId, teamStatus, otherTeamsStatus) {
    const players = await this.getPlayersByTeamId(teamId);
    console.log('PLAYERS', players);
    const otherPlayers = await this.getAllOtherPlayers(teamId);
    console.log('OTHER PLAYERS', otherPlayers);

    const batch = writeBatch(firestore);

    for (const player of players) {
      batch.update(doc(this.collectionRef, player.id), { status: teamStatus });
    }

    for (const player of otherPlayers) {
      batch.update(doc(this.collectionRef, player.id), { status: otherTeamsStatus });
    }

    await batch.commit();
  }

  // React hooks for real-time operations
  usePlayer(playerId) {
    const { data, loading, error } = super.useDocument(playerId);
    return {
      player: data ? new Player(data) : null,
      loading,
      error,
    };
  }

  usePlayerOnce(id) {
    const { data, loading, error } = super.useDocumentOnce(id);
    return {
      player: data ? new Player(data) : null,
      loading,
      error,
    };
  }

  usePlayerIdentityOnce(id) {
    const { data, loading, error } = super.useDocumentOnce(id);
    return {
      player: data ? { id: data.id, name: data.name, teamId: data.teamId } : null,
      loading,
      error,
    };
  }

  useAllPlayerIdentitiesOnce() {
    const { data, loading, error } = super.useCollectionOnce();
    return {
      players: data.map((p) => ({
        id: p.id,
        name: p.name,
        teamId: p.teamId,
      })),
      loading,
      error,
    };
  }

  usePlayerStates() {
    const { data, loading, error } = super.useCollection();
    return {
      playerStates: data.map((p) => ({
        id: p.id,
        status: p.status,
      })),
      loading,
      error,
    };
  }

  useAllPlayers() {
    const { data, loading, error } = super.useCollection();
    return {
      players: data.map((p) => new Player(p)),
      loading,
      error,
    };
  }

  useAllPlayersOnce() {
    const { data, loading, error } = super.useCollectionOnce();
    return {
      players: data.map((p) => new Player(p)),
      loading,
      error,
    };
  }

  useTeamPlayers(teamId) {
    const queryBuilder = (collectionRef) => query(collectionRef, where('teamId', '==', teamId));
    const { data, loading, error } = super.useQuery(queryBuilder);
    return {
      players: data.map((p) => new Player(p)),
      loading,
      error,
    };
  }

  usePlayersByStatus(status) {
    const queryBuilder = (collectionRef) => query(collectionRef, where('status', '==', status));
    const { data, loading, error } = super.useQuery(queryBuilder);
    return {
      players: data.map((p) => new Player(p)),
      loading,
      error,
    };
  }
}
