import type { ApiEnvelope } from './types';

const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:3000').replace(/\/$/, '');
const TOKEN_KEY = 'dynamic-surveys-access-token';

export class ApiRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly details: unknown[] = [],
  ) {
    super(message);
  }
}

export const getAccessToken = () =>
  typeof window === 'undefined' ? null : window.localStorage.getItem(TOKEN_KEY);

export const setAccessToken = (token: string | null) => {
  if (typeof window === 'undefined') return;
  if (token) window.localStorage.setItem(TOKEN_KEY, token);
  else window.localStorage.removeItem(TOKEN_KEY);
};

let refreshRequest: Promise<string | null> | null = null;

const refreshAccessToken = async () => {
  if (refreshRequest) return refreshRequest;
  refreshRequest = fetch(`${API_URL}/api/v1/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
    headers: { Accept: 'application/json' },
  })
    .then(async (response) => {
      if (!response.ok) return null;
      const payload = (await response.json()) as ApiEnvelope<{ accessToken: string }>;
      setAccessToken(payload.data.accessToken);
      return payload.data.accessToken;
    })
    .catch(() => null)
    .finally(() => {
      refreshRequest = null;
    });
  return refreshRequest;
};

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
  options: { auth?: boolean; retry?: boolean } = {},
): Promise<ApiEnvelope<T>> {
  const auth = options.auth ?? true;
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  const token = getAccessToken();
  if (auth && token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers,
    credentials: 'include',
  });

  if (response.status === 401 && auth && options.retry !== false) {
    const refreshed = await refreshAccessToken();
    if (refreshed) return apiRequest<T>(path, init, { auth, retry: false });
    setAccessToken(null);
  }

  const payload = (await response.json().catch(() => null)) as ApiEnvelope<T> | null;
  if (!response.ok || !payload?.success) {
    throw new ApiRequestError(
      payload?.message ?? 'Something went wrong. Please try again.',
      response.status,
      payload?.errors ?? [],
    );
  }
  return payload;
}
