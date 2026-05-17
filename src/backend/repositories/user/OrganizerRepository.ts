import { type Transaction } from 'firebase/firestore';

import FirebaseRepository from '@/backend/repositories/FirebaseRepository';
import { Organizer } from '@/models/users/organizer';
import { type ParticipantData } from '@/models/users/participant';

export default class OrganizerRepository extends FirebaseRepository {
  constructor(gameId: string) {
    super(['games', gameId, 'organizers']);
  }

  async getOrganizer(id: string): Promise<Organizer | null> {
    const data = await super.get(id);
    return data ? new Organizer(data as unknown as ParticipantData) : null;
  }

  async getAllOrganizers(): Promise<Organizer[]> {
    const data = await super.getAll();
    return data.map((o) => new Organizer(o as unknown as ParticipantData));
  }

  async getAllOrganizerIds(): Promise<string[]> {
    const data = await super.getAll();
    return data.map((o) => o.id as string);
  }

  async getAllOrganizersTransaction(_transaction: Transaction): Promise<void> {}

  async createOrganizer(organizerData: ParticipantData, id: string | null = null): Promise<Organizer> {
    const data = await super.create(organizerData as unknown as Record<string, unknown>, id);
    return new Organizer(data as unknown as ParticipantData);
  }

  async updateOrganizer(id: string, organizerData: Record<string, unknown>): Promise<Organizer> {
    const data = await super.update(id, organizerData);
    return new Organizer(data as unknown as ParticipantData);
  }

  async createOrganizerTransaction(transaction: Transaction, organizerData: ParticipantData): Promise<Organizer> {
    const data = await super.createTransaction(transaction, organizerData as unknown as Record<string, unknown>);
    return new Organizer(data as unknown as ParticipantData);
  }

  useOrganizer(id: string) {
    const { data, loading, error } = super.useDocument(id);
    return { organizer: data ? new Organizer(data as unknown as ParticipantData) : null, loading, error };
  }

  useOrganizerOnce(id: string) {
    const { data, loading, error } = super.useDocumentOnce(id);
    return { organizer: data ? new Organizer(data as unknown as ParticipantData) : null, loading, error };
  }

  useAllOrganizersOnce() {
    const { data, loading, error } = super.useCollectionOnce();
    return { organizers: data.map((o) => new Organizer(o as unknown as ParticipantData)), loading, error };
  }

  useAllOrganizerIdentitiesOnce() {
    const { data, loading, error } = super.useCollectionOnce();
    return { organizers: data.map((o) => ({ id: o.id as string, name: o.name as string })), loading, error };
  }

  useIsOrganizer(organizerId: string) {
    const { data, loading, error } = super.useDocumentOnce(organizerId);
    return { isOrganizer: data !== null, loading, error };
  }
}
