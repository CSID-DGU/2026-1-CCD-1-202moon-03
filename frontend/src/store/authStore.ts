import { create } from 'zustand';
import { ROUTES } from '../constants/routes';
import { login as loginRequest, logout as logoutRequest, refreshAccessToken } from '../services/auth.api';
import { getMyProfile } from '../services/user.api';
import type { AuthUser, LoginRequest, LoginResponse, LogoutRequest, UserProfileData } from '../types';

const REFRESH_TOKEN_STORAGE_KEY = 'refreshToken';

interface LogoutOptions {
  revokeToken?: boolean;
  redirectToLogin?: boolean;
}

interface AuthState {
  accessToken: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  setAccessToken: (accessToken: string | null) => void;
  setUser: (user: AuthUser | null) => void;
  login: (payload: LoginRequest) => Promise<LoginResponse>;
  logout: (options?: LogoutOptions) => Promise<void>;
  hydrateAuth: () => Promise<void>;
}

function mapProfileToAuthUser(profile: Partial<UserProfileData> & {
  user_id?: number;
  username?: string;
  nickname?: string;
}) {
  const username = profile.username ?? '';
  const nickname = profile.nickname ?? username;

  return {
    id: String(profile.user_id ?? username ?? ''),
    username,
    nickname,
    name: nickname || username,
    email: profile.email ?? '',
    avatarType: profile.avatar_type,
    stimulationLevel: profile.stimulation_level,
    isTutorialDone: profile.is_tutorial_done,
    createdAt: profile.created_at,
  } satisfies AuthUser;
}

function redirectToLogin() {
  if (window.location.pathname !== ROUTES.login) {
    window.location.assign(ROUTES.login);
  }
}

function clearStoredAuth(set: (partial: Partial<AuthState>) => void) {
  window.localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
  set({
    accessToken: null,
    user: null,
    isAuthenticated: false,
    isHydrated: true,
  });
}

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: null,
  user: null,
  isAuthenticated: false,
  isHydrated: false,
  setAccessToken: (accessToken) =>
    set({
      accessToken,
      isAuthenticated: Boolean(accessToken),
    }),
  setUser: (user) =>
    set((state) => ({
      user,
      isAuthenticated: Boolean(state.accessToken),
    })),
  login: async (payload) => {
    const response = await loginRequest(payload);
    const nextUser = mapProfileToAuthUser(response.data);

    window.localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, response.data.refresh_token);

    set({
      accessToken: response.data.access_token,
      user: nextUser,
      isAuthenticated: true,
      isHydrated: true,
    });

    return response;
  },
  logout: async (options = {}) => {
    const { revokeToken = true, redirectToLogin: shouldRedirect = false } = options;
    const refreshToken = window.localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);

    if (revokeToken && refreshToken) {
      try {
        const payload: LogoutRequest = { refresh: refreshToken };
        await logoutRequest(payload);
      } catch {
        // Ignore logout API failures and clear local auth state anyway.
      }
    }

    clearStoredAuth(set);

    if (shouldRedirect) {
      redirectToLogin();
    }
  },
  hydrateAuth: async () => {
    const refreshToken = window.localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);

    if (!refreshToken) {
      set({
        accessToken: null,
        user: null,
        isAuthenticated: false,
        isHydrated: true,
      });
      return;
    }

    try {
      const response = await refreshAccessToken({ refresh: refreshToken });
      get().setAccessToken(response.access);
      const profileResponse = await getMyProfile();
      get().setUser(mapProfileToAuthUser(profileResponse.data));
      set({ isHydrated: true });
    } catch {
      clearStoredAuth(set);
    }
  },
}));
