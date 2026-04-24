'use client';

function resolveApiUrl() {
  if (typeof window !== 'undefined') {
    return '';
  }

  return process.env.NEXT_PUBLIC_API_URL || '';
}

export function getToken() {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem('mysecret_token');
}

export function setToken(token) {
  if (typeof window !== 'undefined') window.localStorage.setItem('mysecret_token', token);
}

export function clearToken() {
  if (typeof window !== 'undefined') window.localStorage.removeItem('mysecret_token');
}

export async function api(path, options = {}) {
  const apiUrl = resolveApiUrl();
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${apiUrl}${path}`, {
    ...options,
    headers,
    credentials: 'include',
    cache: 'no-store'
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || 'הבקשה נכשלה');
  return data;
}
