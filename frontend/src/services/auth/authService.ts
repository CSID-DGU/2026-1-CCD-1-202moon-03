import { api } from '../api';
import type { AuthUser } from '../../types/auth';

export async function fetchMe() {
  return api<AuthUser>('/api/auth/me');
}
