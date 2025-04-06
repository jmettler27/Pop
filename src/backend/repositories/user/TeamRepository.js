import FirebaseRepository from '@/backend/repositories/FirebaseRepository';

import Team from '@/backend/models/Team';


export default class TeamRepository extends FirebaseRepository {
    constructor(gameId) {
        super(['games', gameId, 'teams']);
    }

    async get(id) {
        const data = await super.get(id);
        return data ? new Team(data) : null;
    }

    async getAll() {
        const data = await super.getAll();
        return data.map(t => new Team(t));
    }

    async getAllTransaction(transaction) {
        const data = await super.getAllTransaction(transaction);
        return data.map(t => new Team(t));
    }

    async create(data, id = null) {
        Team.validateName(data.name);
        Team.validateColor(data.color);
        const data = await super.create(data, id);
        return new Team(data);
    }

    async update(id, data) {
        if (data.name) Team.validateName(data.name);
        if (data.color) Team.validateColor(data.color);
        const data = await super.update(id, data);
        return new Team(data);
    }

    async getNumTeams(transaction) {
        const data = await super.getNumDocuments(transaction);
        return data;
    }

    // React hooks for real-time operations
    useTeam(id) {
        const { data, loading, error } = super.useDocument(id);
        return {
            team: data ? new Team(data) : null,
            loading,
            error
        };
    }

    useTeamOnce(id) {
        const { data, loading, error } = super.useDocumentOnce(id);
        return {
            team: data ? new Team(data) : null,
            loading,
            error
        };
    }

    useAllTeams() {
        const { data, loading, error } = super.useCollection();
        return {
            teams: data.map(t => new Team(t)),
            loading,
            error
        };
    }

    useAllTeamsOnce() {
        const { data, loading, error } = super.useCollectionOnce();
        return {
            teams: data.map(t => new Team(t)),
            loading,
            error
        };
    }

    useJoinableTeams() {
        const { data, loading, error } = super.useCollection(
            {
                where: {
                    field: 'teamAllowed',
                    operator: '==',
                    value: true
                }
            }
        )
        return {
            teams: data.map(t => new Team(t)),
            loading,
            error
        };
    }
} 