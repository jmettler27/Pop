/**
 * Wire types for the Go backend (`back-pop`). Hand-mirrored from
 * `back-pop/api/openapi.yaml` — the source of truth for routes and shapes. Keep
 * this in sync when the spec changes (a later PR may replace this with codegen).
 */

import type {
  GameActionName,
  PlayerActionName,
  QuestionActionName,
  RoundActionName,
  RoundQuestionActionName,
  TimerActionName,
} from './actions';

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

/** `GET /users?ids=` — public display fields; unknown ids are omitted. */
export interface PublicUser {
  id: string;
  name: string;
  image: string | null;
}

// ---------------------------------------------------------------------------
// Request bodies
// ---------------------------------------------------------------------------

export interface CreateGameRequest {
  title: string;
  lang: Locale;
  maxPlayers: number;
  roundScorePolicy: ScorePolicy;
  /** Optional per-game organizer nickname; falls back to the token profile name. */
  organizerName?: string;
}

export interface GameActionRequest {
  action: GameActionName;
}

export interface TimerActionRequest {
  action: TimerActionName;
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
  action: PlayerActionName;
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
  action: RoundActionName;
  /** New question order (action = round_reorder_questions). */
  questions?: string[];
  /** Seconds (action = round_set_thinking_time). */
  thinkingTime?: number;
  /** Seconds (action = round_set_challenge_time). */
  challengeTime?: number;
  /** Ended question id (action = round_end_question; informational). */
  questionId?: string;
}

/**
 * `PUT /games/{g}/rounds/{r}/questions/{q}` — per-question editor override. The
 * round-level `RoundActionRequest` sets the default for every question; this
 * overrides a single one.
 */
export interface RoundQuestionActionRequest {
  action: RoundQuestionActionName;
  seconds: number;
}

// The `*_ACTIONS` name constants and their `*ActionName` unions live in
// `./actions` (imported above for local use; re-exported here and from the
// `@/api` barrel so existing `@/api/types` importers keep working).
export {
  GAME_ACTIONS,
  PLAYER_ACTIONS,
  QUESTION_ACTIONS,
  ROUND_ACTIONS,
  ROUND_QUESTION_ACTIONS,
  TIMER_ACTIONS,
  type GameActionName,
  type PlayerActionName,
  type QuestionActionName,
  type RoundActionName,
  type RoundQuestionActionName,
  type TimerActionName,
} from './actions';

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
