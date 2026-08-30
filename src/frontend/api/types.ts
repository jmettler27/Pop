/**
 * Wire types for the Go backend (`back-pop`). Hand-mirrored from
 * `back-pop/api/openapi.yaml` — the source of truth for routes and shapes. Keep
 * this in sync when the spec changes (a later PR may replace this with codegen).
 */

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export type Locale = 'en' | 'fr';

export type GameType = 'rounds';

export type GameStatus =
  | 'game_edit'
  | 'game_start'
  | 'game_home'
  | 'round_start'
  | 'round_end'
  | 'question_active'
  | 'question_end'
  | 'game_end';

export type ScorePolicy = 'ranking' | 'completion_rate';

export type QuestionType =
  | 'basic'
  | 'blindtest'
  | 'emoji'
  | 'enumeration'
  | 'estimation'
  | 'image'
  | 'labelling'
  | 'matching'
  | 'mcq'
  | 'nagui'
  | 'odd_one_out'
  | 'progressive_clues'
  | 'quote'
  | 'reordering';

export type Topic =
  | 'animals'
  | 'anime_manga'
  | 'economics'
  | 'education'
  | 'entertainment'
  | 'food'
  | 'geography'
  | 'history'
  | 'internet'
  | 'language'
  | 'literature'
  | 'misc'
  | 'movie'
  | 'music'
  | 'news'
  | 'painting'
  | 'philosophy'
  | 'politics'
  | 'science'
  | 'sports'
  | 'tech'
  | 'theme_park'
  | 'tv'
  | 'video_game';

// ---------------------------------------------------------------------------
// Responses
// ---------------------------------------------------------------------------

/** `{ message }` body of every 4xx/5xx. */
export interface ApiErrorBody {
  message: string;
}

/** ISO 8601 date-time string (nullable timestamps come back as `null`). */
export type IsoDateTime = string;

export interface GameResponse {
  id: string;
  title: string;
  type: GameType;
  status: GameStatus;
  lang: Locale;
  maxPlayers: number;
  roundScorePolicy: ScorePolicy;
  rounds: string[];
  currentRound?: string | null;
  currentQuestion?: string | null;
  currentQuestionType?: string | null;
  launchedAt?: IsoDateTime | null;
  dateStart?: IsoDateTime | null;
  dateEnd?: IsoDateTime | null;
}

export interface QuestionBankItem {
  id: string;
  type: QuestionType;
  topic: Topic;
  lang: Locale;
  approved?: boolean;
  createdBy?: string;
  createdAt?: IsoDateTime | null;
  details?: Record<string, unknown>;
}

export interface QuestionBankPage {
  items: QuestionBankItem[];
  hasMore: boolean;
}

export interface QuestionCountResponse {
  count: number;
}

export interface PlayableQuestionResponse {
  id: string;
  type: QuestionType;
  topic: Topic;
  lang: Locale;
  /** Present once the question has started; answer-redacted by role. */
  details?: Record<string, unknown>;
}

export interface EditableQuestion {
  id: string;
  type: QuestionType;
  topic: Topic;
  lang: Locale;
  approved?: boolean;
  createdBy?: string;
  createdAt?: IsoDateTime | null;
  details?: Record<string, unknown>;
}

export interface EditableQuestionsResponse {
  /** Keyed by question id. */
  questions: Record<string, EditableQuestion>;
}

export interface QuestionIdResponse {
  id: string;
}

export interface RoundIdResponse {
  id: string;
}

// ---------------------------------------------------------------------------
// Request bodies
// ---------------------------------------------------------------------------

export interface CreateGameRequest {
  title: string;
  lang: Locale;
  maxPlayers: number;
  roundScorePolicy: ScorePolicy;
}

export interface GameActionRequest {
  action: 'start' | 'reset' | 'end' | 'return_to_home' | 'resume_editing' | 'launch';
}

export interface TimerActionRequest {
  action: 'start' | 'stop' | 'reset' | 'end';
  duration?: number;
}

export interface AddSoundRequest {
  filename: string;
}

export interface JoinGameRequest {
  playerName: string;
  playInTeams: boolean;
  joinTeam?: boolean | null;
  teamId?: string;
  teamName?: string;
  teamColor?: string;
}

export interface PlayerActionRequest {
  action: 'ready' | 'toggle_authorization' | 'reset_all_status';
  authorized?: boolean | null;
}

export interface AddRoundRequest {
  title: string;
  /** Round type == the question type it holds (rounds are homogeneous). */
  type: QuestionType;
}

export interface AddRoundQuestionRequest {
  questionId: string;
}

export interface RoundActionRequest {
  action: 'update' | 'thinking_time' | 'challenge_time' | 'start' | 'select' | 'question_end';
  /** New question order (action = update). */
  questions?: string[];
  /** Seconds (action = thinking_time). */
  thinkingTime?: number;
  /** Seconds (action = challenge_time). */
  challengeTime?: number;
  /** Ended question id (action = question_end; informational). */
  questionId?: string;
}

export type QuestionActionName =
  | 'end'
  | 'reset'
  | 'countdown_end'
  | 'select_choice'
  | 'handle_answer'
  | 'add_player_to_buzzer'
  | 'remove_player_from_buzzer'
  | 'clear_buzzer'
  | 'validate_answer'
  | 'invalidate_answer'
  | 'handle_buzzer_head_changed'
  | 'reveal_clue'
  | 'select_option'
  | 'handle_hide_answer'
  | 'select_proposal'
  | 'reveal_label'
  | 'validate_all_labels'
  | 'cancel_player'
  | 'reveal_quote_element'
  | 'validate_all_quote_elements'
  | 'submit_bet'
  | 'submit_ordering'
  | 'submit_match'
  | 'add_bet'
  | 'end_thinking'
  | 'validate_item'
  | 'increment_valid_items';

/**
 * One flat body for every in-game question action (mirrors the spec — not a
 * discriminated union). The server validates the payload per action; extra
 * fields are tolerated.
 */
export interface QuestionActionRequest {
  action: QuestionActionName;
  playerId?: string;
  teamId?: string;
  quoteElem?: 'source' | 'author' | 'quote';
  betType?: 'exact' | 'range';
  estimation?: string;
  lower?: string;
  upper?: string;
  orderedTitles?: string[];
  edges?: Array<{ from: string; to: string }>;
  choiceIdx?: number;
  optionIdx?: number;
  itemIdx?: number;
  labelIdx?: number;
  quotePartIdx?: number;
  bet?: number;
  correct?: boolean;
  [key: string]: unknown;
}

/**
 * `POST /questions` / `PUT /questions/{id}` are `multipart/form-data`: a `data`
 * field (JSON string of `{ type, topic, lang, details }`) plus optional `image` /
 * `audio` binary parts. Build the `FormData` at the call site and pass it as the
 * request body.
 */
export interface QuestionMultipartData {
  type: QuestionType;
  topic: Topic;
  lang: Locale;
  details: Record<string, unknown>;
}
