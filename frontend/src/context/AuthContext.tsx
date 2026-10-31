import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, StorageStats } from '../types';
import { authApi, storageApi } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  storage: StorageStats | null;
  isLoading: boolean;
  login: (data: any) => Promise<void>;
  loginWithToken: (token: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  refreshStorage: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('memopix_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('memopix_token'));
  const [storage, setStorage] = useState<StorageStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshStorage = async () => {
    try {
      if (token) {
        const res = await storageApi.getUsage();
        if (res.success && res.data) {
          setStorage(res.data);
        }
      }
    } catch {
      // ignore
    }
  };

  const refreshProfile = async () => {
    try {
      if (token) {
        const res = await authApi.getMe();
        if (res.success && res.data) {
          setUser(res.data.user);
          setStorage(res.data.storage);
          localStorage.setItem('memopix_user', JSON.stringify(res.data.user));
        }
      }
    } catch (err) {
      console.error('Failed to load user profile:', err);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        await refreshProfile();
      }
      setIsLoading(false);
    };
    initAuth();
  }, [token]);

  const login = async (data: any) => {
    const res = await authApi.login(data);
    if (res && res.success && res.data) {
      const { user: loggedInUser, token: authToken } = res.data;
      setUser(loggedInUser);
      setToken(authToken);
      localStorage.setItem('memopix_token', authToken);
      localStorage.setItem('memopix_user', JSON.stringify(loggedInUser));
      if (res.data.storage) {
        setStorage(res.data.storage);
      } else {
        await refreshStorage();
      }
    } else {
      throw new Error('Login failed. Please check your credentials.');
    }
  };

  /**
   * loginWithToken — used after Google OAuth redirect.
   * Stores the token, then fetches the full user profile.
   */
  const loginWithToken = async (authToken: string) => {
    localStorage.setItem('memopix_token', authToken);
    setToken(authToken);
    // Fetch profile — uses the token just stored
    const res = await authApi.getMe();
    if (res.success && res.data) {
      setUser(res.data.user);
      setStorage(res.data.storage);
      localStorage.setItem('memopix_user', JSON.stringify(res.data.user));
    }
  };

  const register = async (data: any) => {
    const res = await authApi.register(data);
    if (res.success && res.data) {
      const { user: registeredUser, token: authToken } = res.data;
      setUser(registeredUser);
      setToken(authToken);
      localStorage.setItem('memopix_token', authToken);
      localStorage.setItem('memopix_user', JSON.stringify(registeredUser));
      await refreshStorage();
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // continue
    } finally {
      setUser(null);
      setToken(null);
      setStorage(null);
      localStorage.removeItem('memopix_token');
      localStorage.removeItem('memopix_user');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        storage,
        isLoading,
        login,
        loginWithToken,
        register,
        logout,
        refreshProfile,
        refreshStorage
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
