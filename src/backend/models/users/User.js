export const UserRole = {
    PLAYER: 'player',
    ORGANIZER: 'organizer',
    SPECTATOR: 'spectator',
}

export class User {
    constructor(data) {
        this.id = data.id;
        this.name = data.name;
        this.image = data.image;
    }
}

