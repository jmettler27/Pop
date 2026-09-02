/**
 * The action-name constants for every `PUT`/`POST` "action request" body the Go
 * backend accepts — the `*ActionRequest.action` enums in
 * `back-pop/api/openapi.yaml`. Hand-mirrored; keep in sync with the spec.
 *
 * Every name is prefixed by the resource it acts on (`game_*`, `timer_*`,
 * `player_*`, `round_*`, `round_question_*`, `question_*` / `buzzer_*` /
 * `<type>_*`). Prefixes for `game_*` / `round_*` deliberately reuse the status
 * vocabulary; `game_return_home` / `game_resume_editing` keep a verb so they
 * don't read as a status.
 */

// --- PUT /games/{g} -----------------------------------------------------
export const GAME_ACTIONS = {
  Start: 'game_start',
  Reset: 'game_reset',
  End: 'game_end',
  ReturnHome: 'game_return_home',
  ResumeEditing: 'game_resume_editing',
  Launch: 'game_launch',
} as const;

/** Every valid `GameActionRequest.action` value. */
export type GameActionName = (typeof GAME_ACTIONS)[keyof typeof GAME_ACTIONS];

// --- PUT /games/{g}/timer ---------------------------------------------
export const TIMER_ACTIONS = {
  Start: 'timer_start',
  Stop: 'timer_stop',
  Reset: 'timer_reset',
  End: 'timer_end',
} as const;

/** Every valid `TimerActionRequest.action` value. */
export type TimerActionName = (typeof TIMER_ACTIONS)[keyof typeof TIMER_ACTIONS];

// --- PUT /games/{g}/players/{p} -------------------------------------
export const PLAYER_ACTIONS = {
  Ready: 'player_ready',
  ToggleAuthorization: 'player_toggle_authorization',
  ResetAllStatus: 'player_reset_all_status',
} as const;

/** Every valid `PlayerActionRequest.action` value. */
export type PlayerActionName = (typeof PLAYER_ACTIONS)[keyof typeof PLAYER_ACTIONS];

// --- PUT /games/{g}/rounds/{r} ------------------------------------
export const ROUND_ACTIONS = {
  ReorderQuestions: 'round_reorder_questions',
  SetThinkingTime: 'round_set_thinking_time',
  SetChallengeTime: 'round_set_challenge_time',
  Start: 'round_start',
  Select: 'round_select',
  EndQuestion: 'round_end_question',
} as const;

/** Every valid `RoundActionRequest.action` value. */
export type RoundActionName = (typeof ROUND_ACTIONS)[keyof typeof ROUND_ACTIONS];

// --- PUT /games/{g}/rounds/{r}/questions/{q} (per-question time override) ---
export const ROUND_QUESTION_ACTIONS = {
  SetThinkingTime: 'round_question_set_thinking_time',
  SetChallengeTime: 'round_question_set_challenge_time',
} as const;

/** Every valid `RoundQuestionActionRequest.action` value. */
export type RoundQuestionActionName = (typeof ROUND_QUESTION_ACTIONS)[keyof typeof ROUND_QUESTION_ACTIONS];

// --- POST /games/{g}/rounds/{r}/questions/{q} (the generic in-game action) ---
/**
 * The in-game question-action names — the `QuestionActionRequest.action` enum
 * (and `back-pop/pkg/question/actions.go`).
 *
 * Every name is prefixed by the question type or the question family it belongs
 * to: `question_*` common lifecycle, `buzzer_*` the buzzer family (basic /
 * blindtest / emoji / image / progressive_clues, plus the buzz queue labelling /
 * quote reuse), `<type>_*` one concrete type's own actions.
 */
export const QUESTION_ACTIONS = {
  // Common to every type, all organizer-driven.
  QuestionClose: 'question_close',
  QuestionReset: 'question_reset',
  QuestionCountdownEnd: 'question_countdown_end',

  // Buzzer family (+ the buzz queue labelling / quote reuse).
  BuzzerPress: 'buzzer_press',
  BuzzerRelease: 'buzzer_release',
  BuzzerClear: 'buzzer_clear',
  BuzzerValidate: 'buzzer_validate',
  BuzzerInvalidate: 'buzzer_invalidate',
  BuzzerHandleHeadChange: 'buzzer_handle_head_change',

  // basic.
  BasicHandleAnswer: 'basic_handle_answer',

  // enumeration.
  EnumerationBet: 'enumeration_bet',
  EnumerationEndThinking: 'enumeration_end_thinking',
  EnumerationValidateItem: 'enumeration_validate_item',
  EnumerationIncrementValidItems: 'enumeration_increment_valid_items',

  // estimation.
  EstimationSubmit: 'estimation_submit',

  // labelling.
  LabellingReveal: 'labelling_reveal',
  LabellingValidateAll: 'labelling_validate_all',
  LabellingInvalidate: 'labelling_invalidate',

  // matching.
  MatchingSubmit: 'matching_submit',

  // mcq.
  McqSelect: 'mcq_select',

  // nagui.
  NaguiSelectOption: 'nagui_select_option',
  NaguiSelectChoice: 'nagui_select_choice',
  NaguiHandleHideAnswer: 'nagui_handle_hide_answer',

  // odd_one_out.
  OddOneOutSelect: 'odd_one_out_select',

  // progressive_clues.
  ProgressiveCluesReveal: 'progressive_clues_reveal',

  // quote.
  QuoteReveal: 'quote_reveal',
  QuoteValidateAll: 'quote_validate_all',
  QuoteInvalidate: 'quote_invalidate',

  // reordering.
  ReorderingSubmit: 'reordering_submit',
} as const;

/** Every valid `QuestionActionRequest.action` value. */
export type QuestionActionName = (typeof QUESTION_ACTIONS)[keyof typeof QUESTION_ACTIONS];
