/**
 * Single entry point for every call to the application's own API.
 *
 * Admin requests were previously plain `fetch` calls with no credentials, so
 * the session cookie was never sent and every /api/admin/* request came back
 * 401 — which is why nothing in the admin panel could save. Routing all calls
 * through here makes `credentials: 'include'` impossible to forget, and gives
 * one place that turns an error response into a usable message.
 */

export class ApiError extends Error {
  status: number;
  code?: string;
  body: any;

  constructor(status: number, message: string, body?: any) {
    super(message);
    this.status = status;
    this.code = body?.code;
    this.body = body;
  }

  /** True when the session is missing or expired. */
  get isUnauthorized(): boolean {
    return this.status === 401;
  }
}

export interface ApiOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  /** Returns null instead of throwing on 404. */
  allowNotFound?: boolean;
}

export async function api<T = any>(path: string, options: ApiOptions = {}): Promise<T> {
  const { body, allowNotFound, headers, ...rest } = options;

  const init: RequestInit = {
    ...rest,
    credentials: 'include',
    headers: {
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(headers as Record<string, string> | undefined),
    },
  };

  if (body !== undefined) {
    init.body = typeof body === 'string' ? body : JSON.stringify(body);
  }

  let res: Response;
  try {
    res = await fetch(path, init);
  } catch (err: any) {
    // A network-level failure, not an application error. Surfacing it is the
    // point: the old checkout swallowed these and invented a fake success.
    throw new ApiError(0, `Could not reach the server (${err?.message || 'network error'}).`);
  }

  if (res.status === 404 && allowNotFound) {
    return null as T;
  }

  const text = await res.text();
  let parsed: any = null;
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = { raw: text };
    }
  }

  if (!res.ok) {
    throw new ApiError(
      res.status,
      parsed?.error || parsed?.message || `Request failed (HTTP ${res.status}).`,
      parsed
    );
  }

  return parsed as T;
}

export const apiGet = <T = any>(path: string, options: ApiOptions = {}) =>
  api<T>(path, { ...options, method: 'GET' });

export const apiPost = <T = any>(path: string, body?: unknown, options: ApiOptions = {}) =>
  api<T>(path, { ...options, method: 'POST', body });

export const apiPut = <T = any>(path: string, body?: unknown, options: ApiOptions = {}) =>
  api<T>(path, { ...options, method: 'PUT', body });

export const apiPatch = <T = any>(path: string, body?: unknown, options: ApiOptions = {}) =>
  api<T>(path, { ...options, method: 'PATCH', body });

export const apiDelete = <T = any>(path: string, options: ApiOptions = {}) =>
  api<T>(path, { ...options, method: 'DELETE' });

/** Formats an amount the way the rest of the store does. */
export function formatSar(amount: number, lang: 'en' | 'ar' = 'en'): string {
  const value = Number.isFinite(amount) ? amount : 0;
  const formatted = value.toLocaleString(lang === 'ar' ? 'ar-SA' : 'en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return lang === 'ar' ? `${formatted} ر.س` : `SAR ${formatted}`;
}
