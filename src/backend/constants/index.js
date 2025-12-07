// Game Constants
export const GAME_STATES = {
  LOBBY: 'LOBBY',
  PLAYING: 'PLAYING',
  FINISHED: 'FINISHED'
}

export const ROUND_TYPES = {
  NORMAL: 'NORMAL',
  FINAL: 'FINAL'
}

// Time Constants (in milliseconds)
export const TIMES = {
  ROUND_DURATION: 60000, // 1 minute
  TRANSITION_DURATION: 5000, // 5 seconds
  BUZZER_TIMEOUT: 3000 // 3 seconds
}

// Score Constants
export const SCORES = {
  CORRECT_ANSWER: 10,
  WRONG_ANSWER: -5,
  BUZZER_PENALTY: -2
}

// Error Messages
export const ERRORS = {
  GAME_NOT_FOUND: 'Game not found',
  INVALID_GAME_STATE: 'Invalid game state',
  PLAYER_NOT_FOUND: 'Player not found',
  TEAM_NOT_FOUND: 'Team not found'
} 