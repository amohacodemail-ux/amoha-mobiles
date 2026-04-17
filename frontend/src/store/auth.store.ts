import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import Cookies from 'js-cookie';
import type { User } from '@/types';
import { authService } from '@/services/auth.service';
import { useWishlistStore } from '@/store/wishlist.store';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, phone: string, password: string, confirmPassword: string) => Promise<void>;
  logout: () => void;
  fetchProfile: () => Promise<void>;
  updateProfile: (updates: Partial<Pick<User, 'name' | 'phone' | 'avatar'>>) => Promise<void>;
  clearError: () => void;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authService.login({ email, password });
          Cookies.set('token', response.token, { expires: 30, sameSite: 'lax' });
          if (response.refreshToken) {
            Cookies.set('refresh_token', response.refreshToken, { expires: 30, sameSite: 'lax' });
          }
          set({
            user: response.user,
            token: response.token,
            isAuthenticated: true,
            isLoading: false,
          });
          // Sync wishlist for the newly logged-in user
          useWishlistStore.getState().fetchWishlist().catch(() => {});
        } catch (err: unknown) {
          const message =
            (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
            'Login failed. Please try again.';
          set({ error: message, isLoading: false });
          throw new Error(message);
        }
      },

      register: async (name, email, phone, password, confirmPassword) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authService.register({
            name, email, phone, password, confirmPassword,
          });
          Cookies.set('token', response.token, { expires: 30, sameSite: 'lax' });
          if (response.refreshToken) {
            Cookies.set('refresh_token', response.refreshToken, { expires: 30, sameSite: 'lax' });
          }
          set({
            user: response.user,
            token: response.token,
            isAuthenticated: true,
            isLoading: false,
          });
          // Clear and sync wishlist for the new user
          useWishlistStore.getState().clearWishlist();
        } catch (err: unknown) {
          const message =
            (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
            'Registration failed. Please try again.';
          set({ error: message, isLoading: false });
          throw new Error(message);
        }
      },

      logout: () => {
        Cookies.remove('token');
        Cookies.remove('refresh_token');
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
        });
        // Clear wishlist so next user doesn't see previous user's items
        useWishlistStore.getState().clearWishlist();
      },

      fetchProfile: async () => {
        const { token } = get();
        if (!token) return;
        set({ isLoading: true });
        try {
          const user = await authService.getProfile();
          set({ user, isAuthenticated: true, isLoading: false });
        } catch {
          Cookies.remove('token');
          Cookies.remove('refresh_token');
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },

      updateProfile: async (updates) => {
        set({ isLoading: true, error: null });
        try {
          const user = await authService.updateProfile(updates);
          set({ user, isLoading: false });
        } catch (err: unknown) {
          const message =
            (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
            'Update failed.';
          set({ error: message, isLoading: false });
          throw new Error(message);
        }
      },

      clearError: () => set({ error: null }),
      setUser: (user) => set({ user }),
    }),
    {
      name: 'amoha-auth',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
