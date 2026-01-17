export default class Team {
  static NAME_MIN_LENGTH = 2;
  static NAME_MAX_LENGTH = 20;

  static COLOR_MIN_LENGTH = 7;
  static COLOR_MAX_LENGTH = 7;

  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.color = data.color;
  }

  static validateName(name) {
    if (!name) {
      throw new Error('Name is required');
    }
    if (name.length < Team.NAME_MIN_LENGTH) {
      throw new Error(`Name must be at least ${Team.NAME_MIN_LENGTH} characters long`);
    }
    if (name.length > Team.NAME_MAX_LENGTH) {
      throw new Error(`Name must be at most ${Team.NAME_MAX_LENGTH} characters long`);
    }
  }

  static validateColor(color) {
    if (!color) {
      throw new Error('Color is required');
    }
  }
}
