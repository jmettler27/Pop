/**
 * One function per `back-pop/api/openapi.yaml` operation. Call sites use these
 * in place of the in-repo `src/backend/services` server actions. Paths, query
 * params, and response shapes track the spec.
 */

import { apiDelete, apiFetch, apiGet, apiPost, apiPut, type ApiRequestInit } from './client';
import type {
  AddRoundQuestionRequest,
  AddRoundRequest,
  AddSoundRequest,
  CreateGameRequest,
  EditableQuestionsResponse,
  GameActionRequest,
  GameResponse,
  JoinGameRequest,
  PlayableQuestionResponse,
  PlayerActionRequest,
  PublicUser,
  QuestionActionRequest,
  QuestionBankPage,
  QuestionCountResponse,
  QuestionIdResponse,
  QuestionType,
  RoundActionRequest,
  RoundIdResponse,
  RoundQuestionActionRequest,
  TimerActionRequest,
} from './types';

const seg = encodeURIComponent;

// --- Games ---------------------------------------------------------------

/** `GET /games?status=` — games the caller organises or plays, newest first. */
export const listGames = (status: 'ended' | 'edit', init?: ApiRequestInit): Promise<GameResponse[]> =>
  apiGet<GameResponse[]>('/games', { ...init, query: { status } });

/** `GET /games/{id}`. */
export const getGame = (gameId: string, init?: ApiRequestInit): Promise<GameResponse> =>
  apiGet<GameResponse>(`/games/${seg(gameId)}`, init);

/** `POST /games` — create a rounds game in the edit state. */
export const createGame = (body: CreateGameRequest, init?: ApiRequestInit): Promise<GameResponse> =>
  apiPost<GameResponse>('/games', body, init);

/** `PUT /games/{id}` — status transition (game_start / game_reset / game_end / …). */
export const updateGame = (gameId: string, body: GameActionRequest, init?: ApiRequestInit): Promise<void> =>
  apiPut<void>(`/games/${seg(gameId)}`, body, init);

/** `PUT /games/{id}/timer`. */
export const updateTimer = (gameId: string, body: TimerActionRequest, init?: ApiRequestInit): Promise<void> =>
  apiPut<void>(`/games/${seg(gameId)}/timer`, body, init);

/** `POST /games/{id}/sounds` — queue a sound for the frontend to play. */
export const addSound = (gameId: string, body: AddSoundRequest, init?: ApiRequestInit): Promise<void> =>
  apiPost<void>(`/games/${seg(gameId)}/sounds`, body, init);

// --- Players -----------------------------------------------------------

/** `POST /games/{id}/players` — join as a player (caller id from the token). */
export const joinGame = (gameId: string, body: JoinGameRequest, init?: ApiRequestInit): Promise<void> =>
  apiPost<void>(`/games/${seg(gameId)}/players`, body, init);

/** `PUT /games/{id}/players/{playerId}` — ready / authorization toggle / reset-all. */
export const updatePlayer = (
  gameId: string,
  playerId: string,
  body: PlayerActionRequest,
  init?: ApiRequestInit
): Promise<void> => apiPut<void>(`/games/${seg(gameId)}/players/${seg(playerId)}`, body, init);

// --- Round structure -------------------------------------------------

/** `POST /games/{id}/rounds`. */
export const addRound = (gameId: string, body: AddRoundRequest, init?: ApiRequestInit): Promise<RoundIdResponse> =>
  apiPost<RoundIdResponse>(`/games/${seg(gameId)}/rounds`, body, init);

/** `DELETE /games/{id}/rounds/{roundId}`. */
export const removeRound = (gameId: string, roundId: string, init?: ApiRequestInit): Promise<void> =>
  apiDelete<void>(`/games/${seg(gameId)}/rounds/${seg(roundId)}`, undefined, init);

/** `PUT /games/{id}/rounds/{roundId}` — edit (round_reorder_questions / round_set_thinking_time / …) + lifecycle (round_start / round_select / round_end_question). */
export const updateRound = (
  gameId: string,
  roundId: string,
  body: RoundActionRequest,
  init?: ApiRequestInit
): Promise<void> => apiPut<void>(`/games/${seg(gameId)}/rounds/${seg(roundId)}`, body, init);

/** `POST /games/{id}/rounds/{roundId}/questions` — add a bank question to a round. */
export const addRoundQuestion = (
  gameId: string,
  roundId: string,
  body: AddRoundQuestionRequest,
  init?: ApiRequestInit
): Promise<void> => apiPost<void>(`/games/${seg(gameId)}/rounds/${seg(roundId)}/questions`, body, init);

/** `DELETE /games/{id}/rounds/{roundId}/questions/{questionId}`. */
export const removeRoundQuestion = (
  gameId: string,
  roundId: string,
  questionId: string,
  init?: ApiRequestInit
): Promise<void> =>
  apiDelete<void>(`/games/${seg(gameId)}/rounds/${seg(roundId)}/questions/${seg(questionId)}`, undefined, init);

/** `PUT /games/{id}/rounds/{roundId}/questions/{questionId}` — per-question thinking / challenge time override. */
export const updateRoundQuestion = (
  gameId: string,
  roundId: string,
  questionId: string,
  body: RoundQuestionActionRequest,
  init?: ApiRequestInit
): Promise<void> =>
  apiPut<void>(`/games/${seg(gameId)}/rounds/${seg(roundId)}/questions/${seg(questionId)}`, body, init);

// --- In-game question ------------------------------------------------

/** `GET /games/{id}/rounds/{roundId}/questions/{questionId}?type=` — answer-redacted by role. */
export const getPlayableQuestion = (
  gameId: string,
  roundId: string,
  questionId: string,
  type: QuestionType,
  init?: ApiRequestInit
): Promise<PlayableQuestionResponse> =>
  apiGet<PlayableQuestionResponse>(`/games/${seg(gameId)}/rounds/${seg(roundId)}/questions/${seg(questionId)}`, {
    ...init,
    query: { type },
  });

/** `POST /games/{id}/rounds/{roundId}/questions/{questionId}` — the generic `{ action, …payload }` endpoint. */
export const questionAction = (
  gameId: string,
  roundId: string,
  questionId: string,
  body: QuestionActionRequest,
  init?: ApiRequestInit
): Promise<void> =>
  apiPost<void>(`/games/${seg(gameId)}/rounds/${seg(roundId)}/questions/${seg(questionId)}`, body, init);

// --- Question bank -------------------------------------------------

/** `GET /questions?type=&pageSize=&pageIndex=` — one offset page, newest first. */
export const listQuestions = (
  type: QuestionType,
  pageSize: number,
  pageIndex: number,
  init?: ApiRequestInit
): Promise<QuestionBankPage> =>
  apiGet<QuestionBankPage>('/questions', { ...init, query: { type, pageSize, pageIndex } });

/** `GET /questions:count?type=`. */
export const countQuestions = (type: QuestionType, init?: ApiRequestInit): Promise<QuestionCountResponse> =>
  apiGet<QuestionCountResponse>('/questions:count', { ...init, query: { type } });

/** `GET /games/{id}/questions:editable?ids=` — full bank docs for the in-game round editor. */
export const getEditableQuestions = (
  gameId: string,
  ids: string[],
  init?: ApiRequestInit
): Promise<EditableQuestionsResponse> =>
  apiGet<EditableQuestionsResponse>(`/games/${seg(gameId)}/questions:editable`, {
    ...init,
    query: { ids: ids.join(',') },
  });

/**
 * `POST /questions` — submit a bank question. Build a `FormData` with a `data`
 * field (JSON string of `{ type, topic, lang, details }`) and optional `image` /
 * `audio` parts (see {@link QuestionMultipartData}).
 */
export const createQuestion = (form: FormData, init?: ApiRequestInit): Promise<QuestionIdResponse> =>
  apiFetch<QuestionIdResponse>('/questions', { ...init, method: 'POST', body: form });

/** `PUT /questions/{id}` — edit a bank question (author only). Same multipart shape as {@link createQuestion}. */
export const updateQuestion = (
  questionId: string,
  form: FormData,
  init?: ApiRequestInit
): Promise<QuestionIdResponse> =>
  apiFetch<QuestionIdResponse>(`/questions/${seg(questionId)}`, { ...init, method: 'PUT', body: form });

// --- Users -------------------------------------------------------------

/** `GET /users?ids=` — public display fields (name, avatar); unknown ids are omitted. */
export const getUsers = (ids: string[], init?: ApiRequestInit): Promise<PublicUser[]> =>
  apiGet<PublicUser[]>('/users', { ...init, query: { ids: ids.join(',') } });
