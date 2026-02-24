import FirebaseRepository from '@/backend/repositories/FirebaseRepository';

import Team from '@/backend/models/Team';
import { shuffle } from '@/backend/utils/arrays';

export default class TeamRepository extends FirebaseRepository {
  constructor(gameId) {
    super(['games', gameId, 'teams']);
  }

  async get(id) {
    const data = await super.get(id);
    return data ? new Team(data) : null;
  }

  async getAllTeams() {
    const data = await super.getAll();
    return data.map((t) => new Team(t));
  }

  async getAllTeamsTransaction(transaction) {}

  async create(data, id = null) {
    Team.validateName(data.name);
    Team.validateColor(data.color);
    const team = await super.create(data, id);
    return new Team(team);
  }

  async createTeamTransaction(transaction, data, id = null) {
    Team.validateName(data.name);
    Team.validateColor(data.color);
    const team = await super.createTransaction(transaction, data, id);
    return new Team(team);
  }

  async update(id, data) {
    if (data.name) Team.validateName(data.name);
    if (data.color) Team.validateColor(data.color);
    const team = await super.update(id, data);
    return new Team(team);
  }

  async getNumTeams(transaction) {
    return await super.getNumDocuments(transaction);
  }

  async getShuffledTeamIds() {
    const teams = await this.getAllTeams();
    const teamIds = teams.map((t) => t.id);
    return shuffle(teamIds);
  }

  async getOtherTeams(teamId) {
    const teams = await this.getAllTeams();
    return teams.filter((t) => t.id !== teamId);
  }

  // React hooks for real-time operations
  useTeam(id) {
    const { data, loading, error } = super.useDocument(id);
    return {
      team: data ? new Team(data) : null,
      loading,
      error,
    };
  }

  useTeamOnce(id) {
    const { data, loading, error } = super.useDocumentOnce(id);
    return {
      team: data ? new Team(data) : null,
      loading,
      error,
    };
  }

  useAllTeams() {
    const { data, loading, error } = super.useCollection();
    return {
      teams: data.map((t) => new Team(t)),
      loading,
      error,
    };
  }

  useAllTeamsOnce() {
    const { data, loading, error } = super.useCollectionOnce();
    return {
      teams: data.map((t) => new Team(t)),
      loading,
      error,
    };
  }

  useJoinableTeams() {
    const { data, loading, error } = super.useCollection({
      where: {
        field: 'teamAllowed',
        operator: '==',
        value: true,
      },
    });
    return {
      teams: data.map((t) => new Team(t)),
      loading,
      error,
    };
  }
}
