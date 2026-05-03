import axios from 'axios';
import type { AxiosError, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import { ROUTES } from '../constants/routes';
import { useAuthStore } from '../store/authStore';
import type { RefreshAccessTokenResponse } from '../types/auth';

const REFRESH_TOKEN_STORAGE_KEY = 'refreshToken';
const REFRESH_ENDPOINT = '/api/auth/token/refresh/';

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

function redirectToLogin() {
  if (window.location.pathname !== ROUTES.login) {
    window.location.assign(ROUTES.login);
  }
}

async function requestAccessTokenRefresh(refreshToken: string) {
  const baseURL = import.meta.env.VITE_API_BASE_URL ?? '';

  return axios.post<RefreshAccessTokenResponse>(
    REFRESH_ENDPOINT,
    { refresh: refreshToken },
    { baseURL },
  );
}

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '',
});

apiClient.interceptors.request.use((config) => {
  const accessToken = useAuthStore.getState().accessToken;

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;
    const status = error.response?.status;

    if (!originalRequest || status !== 401) {
      return Promise.reject(error);
    }

    if (originalRequest.url?.includes(REFRESH_ENDPOINT) || originalRequest._retry) {
      await useAuthStore.getState().logout({ revokeToken: false, redirectToLogin: true });
      return Promise.reject(error);
    }

    const refreshToken = window.localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);

    if (!refreshToken) {
      await useAuthStore.getState().logout({ revokeToken: false, redirectToLogin: true });
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      const refreshResponse = await requestAccessTokenRefresh(refreshToken);
      const nextAccessToken = refreshResponse.data.access;
      useAuthStore.getState().setAccessToken(nextAccessToken);

      originalRequest.headers = originalRequest.headers ?? {};
      originalRequest.headers.Authorization = `Bearer ${nextAccessToken}`;

      return apiClient.request(originalRequest as AxiosRequestConfig);
    } catch (refreshError) {
      await useAuthStore.getState().logout({ revokeToken: false, redirectToLogin: true });
      redirectToLogin();
      return Promise.reject(refreshError);
    }
  },
);
