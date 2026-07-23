import * as SecureStore from 'expo-secure-store';

// Default production API URL
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://tfg-fitwe.vercel.app';

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

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const responseData = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(responseData.message || responseData.error || `HTTP error ${response.status}`);
  }

  return responseData;
}

export const api = {
  get: (endpoint: string) => fetchApi(endpoint, { method: 'GET' }),
  post: (endpoint: string, body?: any) => fetchApi(endpoint, { method: 'POST', body: JSON.stringify(body) }),
  put: (endpoint: string, body?: any) => fetchApi(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (endpoint: string) => fetchApi(endpoint, { method: 'DELETE' }),
};
