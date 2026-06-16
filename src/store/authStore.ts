import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import * as authService from '../services/auth';
import type { User, LoginRequest } from '../../shared/types';

interface AuthState {
  token: string | null;
  user: User | null;
  permissions: string[];
  isAuthenticated: boolean;
  loading: boolean;
  login: (data: LoginRequest) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  fetchCurrentUser: () => Promise<void>;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      permissions: [],
      isAuthenticated: false,
      loading: false,

      login: async (data: LoginRequest) => {
        set({ loading: true });
        try {
          const response = await authService.login(data);
          if (response.code === 200 && response.data) {
            const { token, user, permissions } = response.data;
            set({
              token,
              user,
              permissions,
              isAuthenticated: true,
              loading: false,
            });
            return { success: true };
          }
          set({ loading: false });
          return { success: false, message: response.message };
        } catch (error: any) {
          set({ loading: false });
          return { success: false, message: error.message || '登录失败' };
        }
      },

      logout: async () => {
        try {
          await authService.logout();
        } catch (error) {
          console.error('Logout error:', error);
        }
        get().clearAuth();
      },

      fetchCurrentUser: async () => {
        try {
          const response = await authService.getCurrentUser();
          if (response.code === 200 && response.data) {
            const { user, permissions } = response.data;
            set({ user, permissions });
          }
        } catch (error) {
          console.error('Fetch user error:', error);
        }
      },

      clearAuth: () => {
        set({
          token: null,
          user: null,
          permissions: [],
          isAuthenticated: false,
        });
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        permissions: state.permissions,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
