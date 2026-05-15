import { type Transaction } from 'firebase/firestore';

import FirebaseRepository from '@/backend/repositories/FirebaseRepository';
import { shuffle } from '@/backend/utils/arrays';
import Team, { type TeamData } from '@/models/team';

export default class TeamRepository extends FirebaseRepository {
  constructor(gameId: string) {
    super(['games', gameId, 'teams']);
  }

  async getTeam(id: string): Promise<Team | null> {
    const data = await super.get(id);
    return data ? new Team(data as unknown as TeamData) : null;
  }

  async getAllTeams(): Promise<Team[]> {
    const data = await super.getAll();
    return data.map((t) => new Team(t as unknown as TeamData));
  }

  async createTeam(data: TeamData, id: string | null = null): Promise<Team> {
    Team.validateName(data.name);
    Team.validateColor(data.color);
    const team = await super.create(data as unknown as Record<string, unknown>, id);
    return new Team(team as unknown as TeamData);
  }

  async createTeamTransaction(transaction: Transaction, data: TeamData, id: string | null = null): Promise<Team> {
    Team.validateName(data.name);
    Team.validateColor(data.color);
    const team = await super.createTransaction(transaction, data as unknown as Record<string, unknown>, id);
    return new Team(team as unknown as TeamData);
  }

  async updateTeam(id: string, data: Record<string, unknown>): Promise<void> {
    await super.update(id, data);
  }

  async getNumTeams(): Promise<number> {
    return super.getNumDocuments();
  }

  async getShuffledTeamIds(): Promise<string[]> {
    const teams = await this.getAllTeams();
    return shuffle(teams.map((t) => t.id!));
  }

  async getOtherTeams(teamId: string): Promise<Team[]> {
    const teams = await this.getAllTeams();
    return teams.filter((t) => t.id !== teamId);
  }

  useTeam(id: string) {
    const { data, loading, error } = super.useDocument(id);
    return { team: data ? new Team(data as unknown as TeamData) : null, loading, error };
  }

  useTeamOnce(id: string) {
    const { data, loading, error } = super.useDocumentOnce(id);
    return { team: data ? new Team(data as unknown as TeamData) : null, loading, error };
  }

  useAllTeams() {
    const { data, loading, error } = super.useCollection();
    return { teams: data.map((t) => new Team(t as unknown as TeamData)), loading, error };
  }

  useAllTeamsOnce() {
    const { data, loading, error } = super.useCollectionOnce();
    return { teams: data.map((t) => new Team(t as unknown as TeamData)), loading, error };
  }

  useJoinableTeams() {
    const { data, loading, error } = super.useCollection({
      where: { field: 'teamAllowed', operator: '==', value: true },
    });
    return { teams: data.map((t) => new Team(t as unknown as TeamData)), loading, error };
  }
}
