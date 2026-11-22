/**
 * Thin HTTP client for Startup Funding API (contract: fundcast-api docs/openapi.json).
 *
 * Every error comes back as ApiError with the HTTP status and the API's `detail` string,
 * so screens can show `error.detail` directly. A 401 on a request that carried a token
 * means the session is no longer valid: the registered handler clears it.
 */

export const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000').replace(
  /\/+$/,
  '',
);

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly detail: string,
  ) {
    super(detail);
    this.name = 'ApiError';
  }
}

export type QueryValue = string | number | undefined;

export interface RequestOptions {
  method?: 'GET' | 'POST';
  token?: string | null;
  /** JSON body; mutually exclusive with `form`. */
  json?: unknown;
  /** Multipart body (file uploads); the runtime sets the boundary header itself. */
  form?: FormData;
  query?: Record<string, QueryValue>;
}

let onUnauthorized: ((token: string) => void) | null = null;

/**
 * Called with the rejected token when an authenticated request gets a 401 (expired or
 * invalid token), so the session can ignore a late 401 for a token it already replaced.
 */
export function setUnauthorizedHandler(handler: ((token: string) => void) | null): void {
  onUnauthorized = handler;
}

function buildUrl(path: string, query?: Record<string, QueryValue>): string {
  const params = Object.entries(query ?? {})
    .filter((entry): entry is [string, string | number] => entry[1] !== undefined)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
  return `${API_URL}${path}${params.length ? `?${params.join('&')}` : ''}`;
}

async function readDetail(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { detail?: unknown } | null;
    if (body && typeof body.detail === 'string') return body.detail;
  } catch {
    // Not JSON (proxy error page, empty body): fall through to the generic message.
  }
  return `Error del servidor (HTTP ${response.status})`;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', token, json, form, query } = options;
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  let body: BodyInit | undefined;
  if (form) {
    body = form;
  } else if (json !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(json);
  }

  let response: Response;
  try {
    response = await fetch(buildUrl(path, query), { method, headers, body });
  } catch {
    throw new ApiError(0, 'No se pudo conectar con el servidor');
  }

  if (!response.ok) {
    const detail = await readDetail(response);
    if (response.status === 401 && token) onUnauthorized?.(token);
    throw new ApiError(response.status, detail);
  }
  return (await response.json()) as T;
}
