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

export type UpdateMyProfileResponse = ApiResponse<{
  nickname: string;
  avatar_type: string;
}>;

export interface ChangeMyPasswordRequest {
  current_password: string;
  new_password: string;
  new_password_confirm: string;
}

export interface ChangeMyPasswordResponseData {
  access: string;
  refresh: string;
}

export type ChangeMyPasswordResponse = ApiResponse<ChangeMyPasswordResponseData>;

export interface DeleteMyAccountRequest {
  password: string;
}

export type DeleteMyAccountResponse = ApiResponse<Record<string, never>>;

export interface UserSettingsData {
  fidget_toggle_key: string;
}

export type GetMySettingsResponse = ApiResponse<UserSettingsData>;

export interface UpdateMySettingsRequest {
  fidget_toggle_key?: string;
}

export type UpdateMySettingsResponse = ApiResponse<UserSettingsData>;
