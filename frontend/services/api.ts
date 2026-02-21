import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '../constants/config';

let accessToken: string | null = null;
let refreshToken: string | null = null;

export const setTokens = (tokens: { accessToken: string; refreshToken: string }) => {
  accessToken = tokens.accessToken;
  refreshToken = tokens.refreshToken;
};

export const clearTokens = () => {
  accessToken = null;
  refreshToken = null;
};

export const TOKEN_STORAGE_KEY = 'fraghub_tokens';

export const saveTokensToStorage = async (tokens: {
  accessToken: string;
  refreshToken: string;
}) => {
  await SecureStore.setItemAsync(TOKEN_STORAGE_KEY, JSON.stringify(tokens));
};

export const loadTokensFromStorage = async () => {
  const stored = await SecureStore.getItemAsync(TOKEN_STORAGE_KEY);
  if (!stored) return null;
  try {
    const parsed = JSON.parse(stored) as { accessToken: string; refreshToken: string };
    accessToken = parsed.accessToken;
    refreshToken = parsed.refreshToken;
    return parsed;
  } catch {
    return null;
  }
};

export const deleteTokensFromStorage = async () => {
  await SecureStore.deleteItemAsync(TOKEN_STORAGE_KEY);
};

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${accessToken}`,
    };
  }
  return config;
});

let isRefreshing = false;
let refreshQueue: Array<(token: string | null) => void> = [];

const processQueue = (token: string | null) => {
  refreshQueue.forEach((resolve) => resolve(token));
  refreshQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry && refreshToken) {
      if (isRefreshing) {
        const token = await new Promise<string | null>((resolve) => {
          refreshQueue.push(resolve);
        });
        if (token) {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        }
        return Promise.reject(error);
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
          refreshToken,
        });

        accessToken = data.accessToken;
        if (accessToken && refreshToken) {
          await saveTokensToStorage({ accessToken, refreshToken });
        }
        processQueue(accessToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(null);
        await deleteTokensFromStorage();
        accessToken = null;
        refreshToken = null;
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

