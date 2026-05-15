export interface Ready {
  numPlayers: number;
  numReady: number;
}

export interface UpdateReady {
  numPlayers?: number;
  numReady?: number;
}
