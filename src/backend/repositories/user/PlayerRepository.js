import FirebaseRepository from '@/backend/repositories/FirebaseRepository';
import { query, where } from 'firebase/firestore';

import { Player } from '@/backend/models/users/Player';

export default class PlayerRepository extends FirebaseRepository {
    
    constructor(gameId) {
        super(['games', gameId, 'players']);
    }

    async getPlayer(playerId) {
        const data = await super.get(playerId);
        return data ? new Player(data) : null;
    }

    async getAllPlayers() {
        const data = await super.getAll();
        return data.map(p => new Player(p));
    }

    async getPlayersByTeamId(teamId) {
        const data = await super.getByField(teamId);
        return data.map(p => new Player(p));
    }

    async getPlayersByTeamIdTransaction(transaction, teamId) {
        const data = await super.getByFieldTransaction(transaction, 'teamId', teamId);
        return data.map(p => new Player(p));
    }

    async getAllOtherPlayersTransaction(transaction, teamId) {
        const data = await super.getByQueryTransaction(transaction, { where: { field: 'teamId', operator: '!=', value: teamId } });
        return data.map(p => new Player(p));
    }
    

    async createPlayer(data, playerId = null) {
        if (!data.name) {
            throw new Error("Player name is required");
        }
        const createdData = await super.create(data, playerId);
        return new Player(createdData);
    }

    async updatePlayer(playerId, data) {
        const updatedData = await super.update(playerId, data);
        return new Player(updatedData);
    }

    async updatePlayerTransaction(transaction, playerId, data) {
        const updatedData = await super.updateTransaction(transaction, playerId, data);
        return new Player(updatedData);
    }

    async updatePlayerStatusTransaction(transaction, playerId, status) {
        const updatedData = await this.updatePlayerTransaction(transaction, playerId, { status });
        return new Player(updatedData);
    }

    async updateAllPlayersStatusTransaction(transaction, status) {
        const players = await super.getAllTransaction(transaction);
        for (const player of players) {
            await this.updatePlayerTransaction(transaction, player.id, { status });
        }
    }

    async updateTeamPlayersStatusTransaction(transaction, teamId, status) {
        const players = await super.getByQueryTransaction(transaction, {
            where: {
                field: 'teamId',
                operator: '==',
                value: teamId
            }
        }).map(p => Player(p));

        for (const player of players) {
            await this.updatePlayerTransaction(transaction, player.id, { status });
        }
    }

    async updateTeamAndOtherTeamsPlayersStatusTransaction(transaction, teamId, teamStatus, otherTeamsStatus) {
        const players = await super.getByQueryTransaction(transaction, {
            where: {
                field: 'teamId',
                operator: '==',
                value: teamId
            }
        }).map(p => Player(p));

        const otherPlayers = await super.getByQueryTransaction(transaction, {
            where: {
                field: 'teamId',
                operator: '!=',
                value: teamId
            }
        }).map(p => Player(p));


        for (const player of players) {
            await this.updatePlayerTransaction(transaction, player.id, { status: teamStatus });
        }

        for (const player of otherPlayers) {
            await this.updatePlayerTransaction(transaction, player.id, { status: otherTeamsStatus });
        }
    }


    // React hooks for real-time operations
    usePlayer(playerId) {
        const { data, loading, error } = super.useDocument(playerId);
        return {
            player: data ? new Player(data) : null,
            loading,
            error
        };
    }

    usePlayerOnce(id) {
        const { data, loading, error } = super.useDocumentOnce(id);
        return {
            player: data ? new Player(data) : null,
            loading,
            error
        };
    }

    usePlayerIdentityOnce(id) {
        const { data, loading, error } = super.useDocumentOnce(id);
        return {
            player: data ? { id: data.id, name: data.name, teamId: data.teamId } : null,
            loading,
            error
        };
    }

    useAllPlayerIdentitiesOnce() {
        const { data, loading, error } = super.useCollectionOnce();
        return {
            players: data.map(p => ({ 
                id: p.id, 
                name: p.name, 
                teamId: p.teamId 
            })),
            loading,
            error
        };
    }


    usePlayerStates() {
        const { data, loading, error } = super.useCollection();
        return {
            playerStates: data.map(p => ({
                id: p.id,
                status: p.status
            })),
            loading,
            error
        };
    }

    useAllPlayers() {
        const { data, loading, error } = super.useCollection();
        return {
            players: data.map(p => new Player(p)),
            loading,
            error
        };
    }

    useAllPlayersOnce() {
        const { data, loading, error } = super.useCollectionOnce();
        return {
            players: data.map(p => new Player(p)),
            loading,
            error
        };
    }
    useTeamPlayers(teamId) {
        const queryBuilder = (collectionRef) => query(
            collectionRef,
            where('teamId', '==', teamId)
        );
        const { data, loading, error } = super.useQuery(queryBuilder);
        return {
            players: data.map(p => new Player(p)),
            loading,
            error
        };
    }

    usePlayersByStatus(status) {
        const queryBuilder = (collectionRef) => query(
            collectionRef,
            where('status', '==', status)
        );
        const { data, loading, error } = super.useQuery(queryBuilder);
        return {
            players: data.map(p => new Player(p)),
            loading,
            error
        };
    }
} 