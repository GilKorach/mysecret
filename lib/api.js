'use client';

let didPurgeLegacyToken = false;

function resolveApiUrl() {
  if (typeof window !== 'undefined') {
    const configured = process.env.NEXT_PUBLIC_API_URL || '';
    if (configured) return configured;

    const isDev = process.env.NODE_ENV !== 'production';
    if (isDev && window.location.port !== '3001') {
      return `${window.location.protocol}//${window.location.hostname}:3001`;
    }
    return '';
  }

  return process.env.NEXT_PUBLIC_API_URL || '';
}

function buildApiUrl(baseUrl, path) {
  const normalizedBase = (baseUrl || '').replace(/\/+$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  if (!normalizedBase) {
    return normalizedPath;
  }

  if (normalizedBase.endsWith('/api') && normalizedPath.startsWith('/api/')) {
    return `${normalizedBase}${normalizedPath.slice(4)}`;
  }

  return `${normalizedBase}${normalizedPath}`;
}

function purgeLegacyToken() {
  if (typeof window === 'undefined' || didPurgeLegacyToken) return;
  window.localStorage.removeItem('mysecret_token');
  didPurgeLegacyToken = true;
}

export async function api(path, options = {}) {
  purgeLegacyToken();
  const apiUrl = resolveApiUrl();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const response = await fetch(buildApiUrl(apiUrl, path), {
    ...options,
    headers,
    credentials: 'include',
    cache: 'no-store'
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || 'הבקשה נכשלה');
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}
