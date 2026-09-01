/**
 * The in-game question-action names — the `QuestionActionRequest.action` enum in
 * `back-pop/api/openapi.yaml` (and `pkg/question/actions.go`). Hand-mirrored;
 * keep in sync with the spec.
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
