import * as SecureStore from 'expo-secure-store';

// Default production API URL
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://fit-we.vercel.app';

if (__DEV__ && !process.env.EXPO_PUBLIC_API_URL) {
  console.warn(
    '[apiClient] EXPO_PUBLIC_API_URL is not set — falling back to production (https://fit-we.vercel.app). ' +
      'Set it in mobile/.env to avoid mixing dev traffic with production data.'
  );
}

const REQUEST_TIMEOUT_MS = 30000;

const TOKEN_KEY = 'fitwe_auth_token';
const USER_KEY = 'fitwe_user_data';

export async function saveAuthToken(token: string) {
  try {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  } catch (error) {
    console.error('Failed to save auth token:', error);
  }
}

export async function getAuthToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch (error) {
    console.error('Failed to get auth token:', error);
    return null;
  }
}

export async function removeAuthToken() {
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
  } catch (error) {
    console.error('Failed to remove auth token:', error);
  }
}

export async function saveUserData(userData: any) {
  try {
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(userData));
  } catch (error) {
    console.error('Failed to save user data:', error);
  }
}

export async function getUserData(): Promise<any | null> {
  try {
    const data = await SecureStore.getItemAsync(USER_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Failed to get user data:', error);
    return null;
  }
}

// Endpoints where a 401 means "invalid credentials", not "session expired" —
// the global unauthorized handler must not force-logout on these.
const AUTH_ENDPOINTS = ['/api/auth/mobile-login', '/api/auth/mobile-register'];

let onUnauthorized: (() => void) | null = null;

/** Registered by AuthContext so any 401 from an authenticated request can trigger a forced logout. */
export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

function handleUnauthorized(endpoint: string) {
  if (AUTH_ENDPOINTS.some((e) => endpoint.includes(e))) return;
  onUnauthorized?.();
}

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const token = await getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  const timeoutController = new AbortController();
  const timeoutId = setTimeout(() => timeoutController.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
      signal: options.signal ?? timeoutController.signal,
    });
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      throw new Error('La solicitud ha tardado demasiado. Comprueba tu conexión e inténtalo de nuevo.');
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }

  const responseData = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401) handleUnauthorized(endpoint);
    throw new Error(responseData.message || responseData.error || `HTTP error ${response.status}`);
  }

  return responseData;
}

export async function fetchApiText(endpoint: string, options: RequestInit = {}): Promise<string> {
  const token = await getAuthToken();
  const headers: Record<string, string> = { ...(options.headers as Record<string, string>) };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  const timeoutController = new AbortController();
  const timeoutId = setTimeout(() => timeoutController.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(url, { ...options, headers, signal: options.signal ?? timeoutController.signal });
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      throw new Error('La solicitud ha tardado demasiado. Comprueba tu conexión e inténtalo de nuevo.');
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    if (response.status === 401) handleUnauthorized(endpoint);
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.message || errorBody.error || `HTTP error ${response.status}`);
  }

  return response.text();
}

export const api = {
  get: (endpoint: string) => fetchApi(endpoint, { method: 'GET' }),
  getText: (endpoint: string) => fetchApiText(endpoint, { method: 'GET' }),
  post: (endpoint: string, body?: any) => fetchApi(endpoint, { method: 'POST', body: JSON.stringify(body) }),
  put: (endpoint: string, body?: any) => fetchApi(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
  patch: (endpoint: string, body?: any) => fetchApi(endpoint, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (endpoint: string) => fetchApi(endpoint, { method: 'DELETE' }),
};
