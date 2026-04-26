import { api } from '../api';
import type {
  LoginRequest,
  LoginResponse,
  SignupRequest,
  SignupResponse,
  AuthUser,
} from '../../types/auth';

const AUTH_PATHS = {
  login: '/api/auth/login',
  signup: '/api/auth/signup',
  me: '/api/auth/me',
  logout: '/api/auth/logout',
} as const;

export async function login(payload: LoginRequest) {
  return api<LoginResponse>(AUTH_PATHS.login, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function signup(payload: SignupRequest) {
  return api<SignupResponse>(AUTH_PATHS.signup, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function fetchMe() {
  return api<AuthUser>(AUTH_PATHS.me);
}

export async function logout() {
  return api<void>(AUTH_PATHS.logout, {
    method: 'POST',
  });
}
