import { apiClient } from './apiClient';
import type {
  ConfirmPasswordResetRequest,
  ConfirmPasswordResetResponse,
  LoginRequest,
  LoginResponseApiResponse,
  LoginResponse,
  LogoutRequest,
  LogoutResponse,
  OnboardingSurveyRequest,
  OnboardingSurveyResponse,
  RefreshAccessTokenApiResponse,
  RefreshAccessTokenRequest,
  RefreshAccessTokenResponse,
  RegisterRequest,
  RegisterResponse,
  RequestPasswordResetRequest,
  RequestPasswordResetResponse,
} from '../types';

export async function login(payload: LoginRequest) {
  const response = await apiClient.post<LoginResponseApiResponse>('/api/auth/login/', payload);
  const { data } = response.data;
  const accessToken = data.access_token ?? ('access' in data ? data.access : undefined) ?? '';
  const refreshToken =
    data.refresh_token ?? ('refresh' in data ? data.refresh : undefined) ?? '';

  return {
    ...response.data,
    data: {
      ...data,
      access_token: accessToken,
      refresh_token: refreshToken,
    },
  } satisfies LoginResponse;
}

export async function register(payload: RegisterRequest) {
  const response = await apiClient.post<RegisterResponse>('/api/auth/register/', payload);
  return response.data;
}

export async function logout(payload: LogoutRequest) {
  const response = await apiClient.post<LogoutResponse>('/api/auth/logout/', payload);
  return response.data;
}

export async function refreshAccessToken(payload: RefreshAccessTokenRequest) {
  const response = await apiClient.post<RefreshAccessTokenApiResponse>(
    '/api/auth/token/refresh/',
    payload,
  );

  if ('access' in response.data) {
    return response.data satisfies RefreshAccessTokenResponse;
  }

  return response.data.data;
}

export async function requestPasswordReset(payload: RequestPasswordResetRequest) {
  const response = await apiClient.post<RequestPasswordResetResponse>(
    '/api/auth/password/reset-request/',
    payload,
  );
  return response.data;
}

export async function confirmPasswordReset(payload: ConfirmPasswordResetRequest) {
  const response = await apiClient.post<ConfirmPasswordResetResponse>(
    '/api/auth/password/reset-confirm/',
    payload,
  );
  return response.data;
}

export async function saveOnboardingSurvey(payload: OnboardingSurveyRequest) {
  const response = await apiClient.post<OnboardingSurveyResponse>('/api/auth/survey/', payload);
  return response.data;
}
