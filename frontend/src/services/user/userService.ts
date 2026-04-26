import { api } from '../api';
import type { UserProfile } from '../../types';

export async function fetchUserProfile(userId: string) {
  return api<UserProfile>(`/api/users/${userId}`);
}
