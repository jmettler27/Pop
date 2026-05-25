export const GameStatus = {
  GAME_EDIT: 'build',
  GAME_START: 'game_start',
  GAME_HOME: 'game_home',
  GAME_END: 'game_end',
  ROUND_START: 'round_start',
  ROUND_END: 'round_end',
  QUESTION_ACTIVE: 'question_active',
  QUESTION_END: 'question_end',
} as const;

export type GameStatus = (typeof GameStatus)[keyof typeof GameStatus];
