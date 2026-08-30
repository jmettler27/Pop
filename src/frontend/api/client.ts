import { auth } from '@/firebase/firebase';

/**
 * Base URL for the Go backend (`back-pop`). Unset → same-origin `/api/backend`,
 * which `next.config.ts` `rewrites` proxies to `BACKEND_ORIGIN` in dev. Set
 * `NEXT_PUBLIC_BACKEND_URL` to call the service directly (prod, CORS).
 */
const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? '/api/backend';

/** A non-2xx response from the backend. `message` is the `{ message }` body when present. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface ApiRequestInit extends Omit<RequestInit, 'body' | 'method'> {
  method?: string;
  /** JSON-serialized, unless it is a `FormData` (then sent as multipart). */
  body?: unknown;
  /** Query params appended to the path; `undefined` / `null` entries are dropped. */
  query?: Record<string, string | number | boolean | null | undefined>;
}

async function idToken(): Promise<string | null> {
  await auth.authStateReady();
  return auth.currentUser ? auth.currentUser.getIdToken() : null;
}

function buildUrl(path: string, query: ApiRequestInit['query']): string {
  const url = `${API_BASE}${path}`;
  if (!query) return url;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null) params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `${url}?${qs}` : url;
}

async function errorMessage(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as { message?: unknown };
    if (typeof data.message === 'string' && data.message) return data.message;
  } catch {
    // non-JSON body — fall through
  }
  return response.statusText || `HTTP ${response.status}`;
}

/**
 * Calls `path` on the Go backend with a Firebase `Authorization: Bearer` header.
 * Throws {@link ApiError} on a non-2xx response; returns `undefined` for
 * `204 No Content`, otherwise the parsed JSON body typed as `T`.
 */
export async function apiFetch<T>(path: string, init: ApiRequestInit = {}): Promise<T> {
  const { body, headers, query, method = 'GET', ...rest } = init;
  const token = await idToken();
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;

  const response = await fetch(buildUrl(path, query), {
    ...rest,
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body !== undefined && !isFormData ? { 'Content-Type': 'application/json' } : {}),
      ...headers,
    },
    body: isFormData ? (body as FormData) : body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    throw new ApiError(response.status, await errorMessage(response));
  }
  if (response.status === 204 || response.headers.get('content-length') === '0') {
    return undefined as T;
  }
  return (await response.json()) as T;
}

export const apiGet = <T>(path: string, init?: ApiRequestInit): Promise<T> =>
  apiFetch<T>(path, { ...init, method: 'GET' });

export const apiPost = <T>(path: string, body?: unknown, init?: ApiRequestInit): Promise<T> =>
  apiFetch<T>(path, { ...init, method: 'POST', body });

export const apiPut = <T>(path: string, body?: unknown, init?: ApiRequestInit): Promise<T> =>
  apiFetch<T>(path, { ...init, method: 'PUT', body });

export const apiDelete = <T>(path: string, body?: unknown, init?: ApiRequestInit): Promise<T> =>
  apiFetch<T>(path, { ...init, method: 'DELETE', body });
