export interface UserData {
  id?: string | undefined;
  name: string;
  image?: string | null;
}

export default class User {
  id: string | undefined;
  name: string;
  image: string | null | undefined;

  constructor(data: UserData) {
    this.id = data.id;
    this.name = data.name;
    this.image = data.image;
  }
}
