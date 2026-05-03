import type { ApiResponse } from './common';

export interface UserProfileData {
  user_id: number;
  username: string;
  nickname: string;
  email: string;
  avatar_type: string;
  stimulation_level: number;
  is_tutorial_done: boolean;
  created_at: string;
}

export type UserProfileResponse = ApiResponse<UserProfileData>;

export interface UpdateMyProfileRequest {
  nickname?: string;
  avatar_type?: string;
}

export type UpdateMyProfileResponse = ApiResponse<UserProfileData>;

export interface ChangeMyPasswordRequest {
  // TODO: API 명세 상세 확정 후 필드 정의
}

export interface ChangeMyPasswordResponse {
  // TODO: API 명세 상세 확정 후 필드 정의
}

export type DeleteMyAccountResponse = ApiResponse<Record<string, never>>;

export interface UserSettingsData {
  avatar_type: string;
  stimulation_level: number;
  is_tutorial_done: boolean;
}

export type GetMySettingsResponse = ApiResponse<UserSettingsData>;

export interface UpdateMySettingsRequest {
  avatar_type?: string;
  stimulation_level?: number;
  is_tutorial_done?: boolean;
}

export type UpdateMySettingsResponse = ApiResponse<UserSettingsData>;
