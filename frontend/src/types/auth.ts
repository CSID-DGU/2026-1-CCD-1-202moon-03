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

export type LoginResponseApiData =
  | LoginResponseData
  | (Omit<LoginResponseData, 'access_token' | 'refresh_token'> & {
      access?: string;
      refresh?: string;
      access_token?: string;
      refresh_token?: string;
    });

export type LoginResponseApiResponse = ApiResponse<LoginResponseApiData>;

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

export type RefreshAccessTokenApiResponse =
  | RefreshAccessTokenResponse
  | ApiResponse<RefreshAccessTokenResponse>;

export interface RequestPasswordResetRequest {
  // TODO: API spec fields
}

export interface RequestPasswordResetResponse {
  // TODO: API spec fields
}

export interface ConfirmPasswordResetRequest {
  // TODO: API spec fields
}

export interface ConfirmPasswordResetResponse {
  // TODO: API spec fields
}

export interface OnboardingSurveyRequest {
  answers: {
    question_number: 1 | 2 | 3 | 4 | 5;
    answer_value: 'low' | 'medium' | 'high';
  }[];
}

export type OnboardingSurveyResponse = ApiResponse<{
  stimulation_level: number;
}>;
