import { User } from '@/backend/models/users/User';

export class Spectator extends User {
  constructor(data) {
    super(data);
  }
}
