import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, getAuthToken, getUserData, saveAuthToken, saveUserData, removeAuthToken } from '../lib/apiClient';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'MEMBER' | 'ADMIN' | 'SUPERADMIN';
  gymId?: string;
  gymName?: string;
  subscriptionStatus?: string;
  avatarUrl?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredSession();
  }, []);

  async function loadStoredSession() {
    try {
      const storedToken = await getAuthToken();
      const storedUser = await getUserData();

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(storedUser);
      }
    } catch (error) {
      console.error('Error loading stored session:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function login(email: string, password: string) {
    setIsLoading(true);
    try {
      const data = await api.post('/api/auth/mobile-login', { email, password });
      
      const authToken = data.token;
      const userData = data.user;

      await saveAuthToken(authToken);
      await saveUserData(userData);

      setToken(authToken);
      setUser(userData);
    } catch (error: any) {
      throw new Error(error.message || 'Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  }

  async function register(registerData: any) {
    setIsLoading(true);
    try {
      const data = await api.post('/api/auth/mobile-register', registerData);
      
      const authToken = data.token;
      const userData = data.user;

      await saveAuthToken(authToken);
      await saveUserData(userData);

      setToken(authToken);
      setUser(userData);
    } catch (error: any) {
      throw new Error(error.message || 'Error en el registro');
    } finally {
      setIsLoading(false);
    }
  }

  async function logout() {
    setIsLoading(true);
    try {
      await removeAuthToken();
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }

  async function refreshUser() {
    try {
      const data = await api.get('/api/user/me');
      if (data.user) {
        setUser(data.user);
        await saveUserData(data.user);
      }
    } catch (error) {
      console.error('Error refreshing user data:', error);
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
