import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import {
  api,
  clearTokens,
  loadTokensFromStorage,
  saveTokensToStorage,
  setTokens,
  deleteTokensFromStorage,
} from '../services/api';

export type UserRole = 'PLAYER' | 'ORGANIZATION';

type User = {
  id: string;
  email: string;
  role: UserRole;
};

type AuthState = {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  initializing: boolean;
};

type AuthContextValue = AuthState & {
  signup: (payload: { email: string; password: string; role: UserRole }) => Promise<void>;
  verifyOtp: (payload: { email: string; otp: string }) => Promise<void>;
  login: (payload: { email: string; password: string }) => Promise<void>;
  requestReset: (payload: { email: string }) => Promise<void>;
  resetPassword: (payload: { email: string; otp: string; newPassword: string }) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const USER_STORAGE_KEY = 'fraghub_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    accessToken: null,
    refreshToken: null,
    initializing: true,
  });

  useEffect(() => {
    const init = async () => {
      try {
        const tokens = await loadTokensFromStorage();
        let user: User | null = null;

        const storedUser = await SecureStore.getItemAsync(USER_STORAGE_KEY);
        if (storedUser) {
          try {
            user = JSON.parse(storedUser) as User;
          } catch {
            user = null;
          }
        }

        setState({
          user,
          accessToken: tokens?.accessToken ?? null,
          refreshToken: tokens?.refreshToken ?? null,
          initializing: false,
        });
      } finally {
        setState((prev) => ({ ...prev, initializing: false }));
      }
    };
    void init();
  }, []);

  const signup: AuthContextValue['signup'] = async (payload) => {
    await api.post('/auth/signup', {
      ...payload,
      role: payload.role.toLowerCase(), // backend expects 'player' | 'organization'
    });
  };

  const verifyOtp: AuthContextValue['verifyOtp'] = async (payload) => {
    await api.post('/auth/verify-otp', payload);
  };

  const login: AuthContextValue['login'] = async (payload) => {
    const { data } = await api.post<{
      accessToken: string;
      refreshToken: string;
      user: User;
    }>('/auth/login', payload);

    const tokens = {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
    };
    setTokens(tokens);
    await saveTokensToStorage(tokens);
    await SecureStore.setItemAsync(USER_STORAGE_KEY, JSON.stringify(data.user));

    setState({
      user: data.user,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      initializing: false,
    });
  };

  const requestReset: AuthContextValue['requestReset'] = async (payload) => {
    await api.post('/auth/request-reset', payload);
  };

  const resetPassword: AuthContextValue['resetPassword'] = async (payload) => {
    await api.post('/auth/reset-password', payload);
  };

  const logout: AuthContextValue['logout'] = async () => {
    await deleteTokensFromStorage();
    await SecureStore.deleteItemAsync(USER_STORAGE_KEY);
    clearTokens();
    setState({
      user: null,
      accessToken: null,
      refreshToken: null,
      initializing: false,
    });
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      signup,
      verifyOtp,
      login,
      requestReset,
      resetPassword,
      logout,
    }),
    [state]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

