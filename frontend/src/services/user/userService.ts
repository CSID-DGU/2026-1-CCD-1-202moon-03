import { getMyProfile } from '../user.api';

export async function fetchUserProfile(_userId?: string) {
  return getMyProfile();
}
