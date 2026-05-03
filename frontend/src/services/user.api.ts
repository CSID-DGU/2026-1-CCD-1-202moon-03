import { apiClient } from './apiClient';
import type {
  ChangeMyPasswordRequest,
  ChangeMyPasswordResponse,
  DeleteMyAccountResponse,
  GetMySettingsResponse,
  UpdateMyProfileRequest,
  UpdateMyProfileResponse,
  UpdateMySettingsRequest,
  UpdateMySettingsResponse,
  UserProfileResponse,
} from '../types';

export async function getMyProfile() {
  const response = await apiClient.get<UserProfileResponse>('/api/users/me/');
  return response.data;
}

export async function updateMyProfile(payload: UpdateMyProfileRequest) {
  const response = await apiClient.patch<UpdateMyProfileResponse>('/api/users/me/', payload);
  return response.data;
}

export async function changeMyPassword(payload: ChangeMyPasswordRequest) {
  const response = await apiClient.put<ChangeMyPasswordResponse>('/api/users/me/password/', payload);
  return response.data;
}

export async function deleteMyAccount() {
  const response = await apiClient.delete<DeleteMyAccountResponse>('/api/users/me/');
  return response.data;
}

export async function getMySettings() {
  const response = await apiClient.get<GetMySettingsResponse>('/api/users/me/settings/');
  return response.data;
}

export async function updateMySettings(payload: UpdateMySettingsRequest) {
  const response = await apiClient.patch<UpdateMySettingsResponse>(
    '/api/users/me/settings/',
    payload,
  );
  return response.data;
}
