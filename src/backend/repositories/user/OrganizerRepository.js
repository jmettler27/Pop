import FirebaseRepository from '@/backend/repositories/FirebaseRepository';

import { Organizer } from '@/backend/models/users/Organizer';

export default class OrganizerRepository extends FirebaseRepository {
  constructor(gameId) {
    super(['games', gameId, 'organizers']);
  }

  async getOrganizer(id) {
    const data = await super.get(id);
    return data ? new Organizer(data) : null;
  }

  async getAllOrganizers() {
    const data = await super.getAll();
    return data.map((organizerData) => new Organizer(organizerData));
  }

  async getAllOrganizersTransaction(transaction) {
    const data = await super.getAllTransaction(transaction);
    return data.map((organizerData) => new Organizer(organizerData));
  }

  async createOrganizer(organizerData, id = null) {
    const data = await super.create(organizerData, id);
    return new Organizer(data);
  }

  async updateOrganizer(id, organizerData) {
    const data = await super.update(id, organizerData);
    return new Organizer(data);
  }

  async createOrganizerTransaction(transaction, organizerData) {
    const data = await super.createTransaction(transaction, organizerData);
    return new Organizer(data);
  }

  // React hooks for real-time operations
  useOrganizer(id) {
    const { data, loading, error } = super.useDocument(id);
    return {
      organizer: data ? new Organizer(data) : null,
      loading,
      error,
    };
  }

  useOrganizerOnce(id) {
    const { data, loading, error } = super.useDocumentOnce(id);
    return {
      organizer: data ? new Organizer(data) : null,
      loading,
      error,
    };
  }

  useAllOrganizersOnce() {
    const { data, loading, error } = super.useCollectionOnce();
    return {
      organizers: data.map((o) => new Organizer(o)),
      loading,
      error,
    };
  }

  useAllOrganizerIdentitiesOnce() {
    const { data, loading, error } = super.useCollectionOnce();
    return {
      organizers: data.map((o) => ({
        id: o.id,
        name: o.name,
      })),
      loading,
      error,
    };
  }

  useIsOrganizer(organizerId) {
    const { data, loading, error } = super.useDocumentOnce(organizerId);
    return {
      isOrganizer: data !== null,
      loading,
      error,
    };
  }
}
