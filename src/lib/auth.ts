const API = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000';

type Tokens = { access: string; refresh: string };

export class HttpError<T = any> extends Error {
  status: number;
  data?: T;

  constructor(message: string, status: number, data?: T) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.data = data;
  }
}

async function safeReadJson(res: Response): Promise<any> {
  const text = await res.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

async function requestJson<T>(url: string, init: RequestInit): Promise<T> {
  let res: Response;

  try {
    res = await fetch(url, init);
  } catch (e) {
    // Network/CORS/DNS etc. (fetch rejects)
    throw new HttpError('Network error: failed to reach server', 0, e);
  }

  const data = await safeReadJson(res);

  if (!res.ok) {
    const message =
      data?.detail ||
      data?.message ||
      data?.non_field_errors?.[0] ||
      `Request failed (${res.status})`;

    throw new HttpError(message, res.status, data);
  }

  return data as T;
}

// --- TOKENS ---
export function getAccessToken() {
  return typeof window === 'undefined' ? null : localStorage.getItem('access');
}
export function getRefreshToken() {
  return typeof window === 'undefined' ? null : localStorage.getItem('refresh');
}
export function setTokens(access: string, refresh: string) {
  localStorage.setItem('access', access);
  localStorage.setItem('refresh', refresh);
}
export function clearTokens() {
  localStorage.removeItem('access');
  localStorage.removeItem('refresh');
}

// --- AUTH CALLS ---
export async function registerUser(payload: {
  username: string;
  email: string;
  password: string;
  password2: string;
}) {
  return requestJson(`${API}/api/auth/register/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function loginUser(payload: {
  email: string;
  password: string;
}): Promise<Tokens> {
  return requestJson<Tokens>(`${API}/api/auth/token/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function getMe() {
  const res = await authFetch('/api/auth/me/');
  const data = await safeReadJson(res);
  if (!res.ok) {
    const msg = data?.detail || data?.message || `Request failed (${res.status})`;
    throw new HttpError(msg, res.status, data);
  }
  return data as { id: number; username: string; email: string; role?: string };
}

// --- AUTO REFRESH (lock to prevent multiple refresh calls) ---
let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const refresh = getRefreshToken();
    if (!refresh) throw new HttpError('No refresh token', 401);

    const data = await requestJson<{ access: string }>(`${API}/api/auth/token/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
    });

    if (!data?.access) throw new HttpError('Refresh failed: no access token returned', 401, data);

    localStorage.setItem('access', data.access);
    return data.access;
  })();

  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}

// --- AUTH FETCH WRAPPER ---
export async function authFetch(path: string, options: RequestInit = {}) {
  const access = getAccessToken();
  const headers = new Headers(options.headers || {});

  const body = options.body;
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;

  if (!isFormData && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (access) headers.set('Authorization', `Bearer ${access}`);

  let res = await fetch(`${API}${path}`, { ...options, headers });

  if (res.status === 401) {
    try {
      const newAccess = await refreshAccessToken();
      headers.set('Authorization', `Bearer ${newAccess}`);
      res = await fetch(`${API}${path}`, { ...options, headers });
    } catch {
      clearTokens();
    }
  }

  return res;
}
