const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

const TOKEN_KEY = 'fastdelivery_token';

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  const body = res.status === 204 ? null : await res.json().catch(() => null);

  if (!res.ok) {
    const message =
      (body && (body.message || body.error)) || `Erro ${res.status}`;
    throw new ApiError(res.status, Array.isArray(message) ? message.join(', ') : message);
  }
  return body as T;
}
