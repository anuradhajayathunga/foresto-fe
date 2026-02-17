const API =
  process.env.NEXT_PUBLIC_API_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  'http://127.0.0.1:8000';

// --------------------
// Types
// --------------------
export type Tokens = { access: string; refresh: string };

export type RestaurantRef = {
  id?: number;
  name?: string;
  slug?: string;
};

export type MeResponse = {
  id: number;
  username: string;
  email: string;
  role?: string;
  first_name?: string;
  last_name?: string;
  restaurant?: RestaurantRef | null;
  restaurant_id?: number | null;
  restaurant_slug?: string | null;
};

export type LoginPayload = {
  email: string;
  password: string;
  // Needed when same email exists in multiple restaurants
  restaurant_slug?: string;
};

export type RegisterPayload = {
  username?: string;
  email: string;
  password: string;
  password2: string;
  first_name?: string;
  last_name?: string;

  // Multi-tenant owner onboarding (optional for backward compatibility)
  restaurant_name?: string;
  restaurant_slug?: string;
};

export type RegisterResponse = {
  id?: number;
  username?: string;
  email?: string;
  role?: string;
  restaurant?: RestaurantRef;
};

export class HttpError extends Error {
  status: number;
  data?: unknown;
  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

// --------------------
// Storage Keys
// --------------------
const ACCESS_KEY = 'access';
const REFRESH_KEY = 'refresh';
const TENANT_ID_KEY = 'active_restaurant_id';
const TENANT_SLUG_KEY = 'active_restaurant_slug';

function hasWindow() {
  return typeof window !== 'undefined';
}

function normalizeSlug(value?: string | null) {
  return (value ?? '').trim().toLowerCase();
}

// --------------------
// JSON helper
// --------------------
async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, init);
  } catch {
    throw new HttpError(`Network error while calling ${url}`, 0);
  }

  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    const msg =
      (typeof data === 'object' && data && 'detail' in (data as any)
        ? (data as any).detail
        : null) ||
      `HTTP ${res.status}`;
    throw new HttpError(String(msg), res.status, data);
  }

  return data as T;
}

// --------------------
// Auth APIs
// --------------------
export async function registerUser(payload: RegisterPayload) {
  // 1st try: send full multi-tenant payload
  try {
    return await requestJson<RegisterResponse>(`${API}/api/auth/register/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (e) {
    // Backward-compatible fallback for old backend serializers
    if (e instanceof HttpError && e.status === 400) {
      const legacyPayload = {
        username: payload.username,
        email: payload.email,
        password: payload.password,
        password2: payload.password2,
        first_name: payload.first_name,
        last_name: payload.last_name,
      };
      return await requestJson<RegisterResponse>(`${API}/api/auth/register/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(legacyPayload),
      });
    }
    throw e;
  }
}

export async function loginUser(payload: LoginPayload) {
  // 1st try: include restaurant_slug for duplicate-email tenancy
  try {
    const result = await requestJson<
      Tokens & {
        restaurant_id?: number;
        restaurant_slug?: string;
        restaurant?: RestaurantRef;
      }
    >(`${API}/api/auth/token/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    syncTenantFromLoginResponse(result, payload.restaurant_slug);
    return result;
  } catch (e) {
    // Backward-compatible fallback for old backend that does not accept restaurant_slug
    if (
      payload.restaurant_slug &&
      e instanceof HttpError &&
      (e.status === 400 || e.status === 401)
    ) {
      const result = await requestJson<Tokens>(`${API}/api/auth/token/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: payload.email, password: payload.password }),
      });
      // keep selected slug if user entered one
      setActiveRestaurantSlug(payload.restaurant_slug);
      return result;
    }
    throw e;
  }
}

export function getAccessToken() {
  return hasWindow() ? localStorage.getItem(ACCESS_KEY) : null;
}
export function getRefreshToken() {
  return hasWindow() ? localStorage.getItem(REFRESH_KEY) : null;
}

export function setTokens(
  access: string,
  refresh: string,
  opts?: { restaurantId?: number | null; restaurantSlug?: string | null }
) {
  if (!hasWindow()) return;
  localStorage.setItem(ACCESS_KEY, access);
  localStorage.setItem(REFRESH_KEY, refresh);

  if (typeof opts?.restaurantId === 'number') {
    localStorage.setItem(TENANT_ID_KEY, String(opts.restaurantId));
  }
  if (opts?.restaurantSlug) {
    localStorage.setItem(TENANT_SLUG_KEY, normalizeSlug(opts.restaurantSlug));
  }
}

export function clearTokens() {
  if (!hasWindow()) return;
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(TENANT_ID_KEY);
  localStorage.removeItem(TENANT_SLUG_KEY);
}

export function getActiveRestaurantId(): number | null {
  if (!hasWindow()) return null;
  const raw = localStorage.getItem(TENANT_ID_KEY);
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

export function getActiveRestaurantSlug(): string | null {
  if (!hasWindow()) return null;
  const slug = normalizeSlug(localStorage.getItem(TENANT_SLUG_KEY));
  return slug || null;
}

export function setActiveRestaurantId(id: number | null) {
  if (!hasWindow()) return;
  if (typeof id === 'number' && Number.isFinite(id)) {
    localStorage.setItem(TENANT_ID_KEY, String(id));
  } else {
    localStorage.removeItem(TENANT_ID_KEY);
  }
}

export function setActiveRestaurantSlug(slug: string | null) {
  if (!hasWindow()) return;
  const normalized = normalizeSlug(slug);
  if (normalized) {
    localStorage.setItem(TENANT_SLUG_KEY, normalized);
  } else {
    localStorage.removeItem(TENANT_SLUG_KEY);
  }
}

export async function getMe() {
  const res = await authFetch('/api/auth/me/');
  const data = (await res.json().catch(() => ({}))) as MeResponse;
  if (!res.ok) {
    throw data;
  }

  // keep tenant context in sync
  const restaurantId =
    typeof data.restaurant_id === 'number'
      ? data.restaurant_id
      : typeof data.restaurant?.id === 'number'
      ? data.restaurant.id
      : null;

  const restaurantSlug =
    data.restaurant_slug ?? data.restaurant?.slug ?? getActiveRestaurantSlug();

  if (restaurantId != null) setActiveRestaurantId(restaurantId);
  if (restaurantSlug) setActiveRestaurantSlug(restaurantSlug);

  return data;
}

// --------------------
// token refresh
// --------------------
let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const refresh = getRefreshToken();
    if (!refresh) throw new HttpError('No refresh token', 401);

    const data = await requestJson<{ access: string }>(
      `${API}/api/auth/token/refresh/`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh }),
      }
    );

    if (!data?.access) {
      throw new HttpError('Refresh failed: no access token returned', 401, data);
    }

    if (hasWindow()) localStorage.setItem(ACCESS_KEY, data.access);
    return data.access;
  })();

  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}

// --------------------
// tenant-aware fetch
// --------------------
export async function authFetch(path: string, options: RequestInit = {}) {
  const access = getAccessToken();
  const restaurantId = getActiveRestaurantId();
  const restaurantSlug = getActiveRestaurantSlug();

  const headers = new Headers(options.headers || {});

  // never set content-type for FormData
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  if (!isFormData && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (access) headers.set('Authorization', `Bearer ${access}`);

  // Either one can be used by backend middleware/views
  if (restaurantId != null && !headers.has('X-Restaurant-Id')) {
    headers.set('X-Restaurant-Id', String(restaurantId));
  }
  if (restaurantSlug && !headers.has('X-Restaurant-Slug')) {
    headers.set('X-Restaurant-Slug', restaurantSlug);
  }

  let res = await fetch(`${API}${path}`, { ...options, headers });

  if (res.status === 401 && getRefreshToken()) {
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

// --------------------
// Helpers
// --------------------
function syncTenantFromLoginResponse(
  response: {
    restaurant_id?: number;
    restaurant_slug?: string;
    restaurant?: RestaurantRef;
  },
  requestedSlug?: string
) {
  const id =
    typeof response.restaurant_id === 'number'
      ? response.restaurant_id
      : typeof response.restaurant?.id === 'number'
      ? response.restaurant.id
      : null;

  const slug = response.restaurant_slug || response.restaurant?.slug || requestedSlug;

  if (id != null) setActiveRestaurantId(id);
  if (slug) setActiveRestaurantSlug(slug);
}

/**
 * Works with DRF list responses regardless of pagination setting.
 * - Non-paginated: [...]
 * - Paginated: { count, next, previous, results: [...] }
 */
export function unwrapList<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  if (
    data &&
    typeof data === 'object' &&
    Array.isArray((data as { results?: unknown[] }).results)
  ) {
    return (data as { results: T[] }).results;
  }
  return [];
}
