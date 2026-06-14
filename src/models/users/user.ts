export interface UserData {
  id?: string | undefined;
  name: string;
  image?: string | null;
  isGuest?: boolean;
}

export default class User {
  id: string | undefined;
  name: string;
  image: string | null | undefined;
  isGuest: boolean | undefined;

  constructor(data: UserData) {
    this.id = data.id;
    this.name = data.name;
    this.image = data.image;
    this.isGuest = data.isGuest;
  }
}
