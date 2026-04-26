import { create } from 'zustand';
import { fetchMe } from '../services/auth/authService';
import type { AuthUser } from '../types/auth';

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isHydrated: boolean;
  setAuth: (user: AuthUser) => void;
  setUser: (user: AuthUser | null) => void;
  clearAuth: () => void;
  hydrateAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  isHydrated: false,
  setAuth: (user) =>
    set({
      user,
      isAuthenticated: true,
      isLoading: false,
      isHydrated: true,
    }),
  setUser: (user) =>
    set({
      user,
      isAuthenticated: Boolean(user),
    }),
  clearAuth: () =>
    set({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      isHydrated: true,
    }),
  hydrateAuth: async () => {
    const { isLoading, isHydrated } = get();

    if (isLoading || isHydrated) {
      return;
    }

    set({ isLoading: true });

    try {
      const user = await fetchMe();
      set({
        user,
        isAuthenticated: true,
        isLoading: false,
        isHydrated: true,
      });
    } catch {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        isHydrated: true,
      });
    }
  },
}));
