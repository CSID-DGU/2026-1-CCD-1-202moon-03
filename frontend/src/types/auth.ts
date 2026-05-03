import type { ApiResponse } from './common';

export interface AuthUser {
  id: string;
  username: string;
  nickname: string;
  name: string;
  email: string;
  avatarType?: string;
  stimulationLevel?: number;
  isTutorialDone?: boolean;
  createdAt?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponseData {
  user_id: number;
  username: string;
  nickname: string;
  access_token: string;
  refresh_token: string;
}

export type LoginResponse = ApiResponse<LoginResponseData>;

export interface RegisterRequest {
  username: string;
  password: string;
  nickname: string;
  email: string;
  birth_date?: string;
  gender?: 'male' | 'female';
}

export interface RegisterResponseData {
  user_id: number;
  username: string;
  nickname: string;
}

export type RegisterResponse = ApiResponse<RegisterResponseData>;

export type SignupRequest = RegisterRequest;
export type SignupResponse = RegisterResponse;

export interface LogoutRequest {
  refresh: string;
}

export type LogoutResponse = ApiResponse<Record<string, never>>;

export interface RefreshAccessTokenRequest {
  refresh: string;
}

export interface RefreshAccessTokenResponse {
  access: string;
}

export interface RequestPasswordResetRequest {
  // TODO: API 명세 상세 확정 후 필드 정의
}

export interface RequestPasswordResetResponse {
  // TODO: API 명세 상세 확정 후 필드 정의
}

export interface ConfirmPasswordResetRequest {
  // TODO: API 명세 상세 확정 후 필드 정의
}

export interface ConfirmPasswordResetResponse {
  // TODO: API 명세 상세 확정 후 필드 정의
}

export interface OnboardingSurveyRequest {
  // TODO: API 명세 상세 확정 후 필드 정의
}

export interface OnboardingSurveyResponse {
  // TODO: API 명세 상세 확정 후 필드 정의
}
