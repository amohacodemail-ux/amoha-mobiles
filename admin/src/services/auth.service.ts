import apiClient from '@/lib/api-client';
import type { AuthResponse, LoginCredentials, AdminUser, ApiResponse } from '@/types';
import Cookies from 'js-cookie';

export const authService = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const { data } = await apiClient.post<AuthResponse>('/auth/login', credentials);
    if (data.success && data.user.role !== 'admin') {
      throw new Error('Access denied. Admin only.');
    }
    if (data.token) {
      Cookies.set('admin_token', data.token, { expires: 1, sameSite: 'lax' });
    }
    if (data.refreshToken) {
      Cookies.set('admin_refresh_token', data.refreshToken, { expires: 1, sameSite: 'lax' });
    }
    return data;
  },

  logout: () => {
    Cookies.remove('admin_token');
    Cookies.remove('admin_refresh_token');
    window.location.href = '/login';
  },

  getProfile: async (): Promise<AdminUser> => {
    const { data } = await apiClient.get<ApiResponse<AdminUser>>('/auth/profile');
    return data.data;
  },

  updateProfile: async (payload: { name: string; email: string; phone?: string }): Promise<AdminUser> => {
    const { data } = await apiClient.put<ApiResponse<AdminUser>>('/auth/profile', payload);
    return data.data;
  },

  changePassword: async (payload: { currentPassword: string; newPassword: string }): Promise<void> => {
    await apiClient.put('/auth/change-password', payload);
  },

  getToken: () => Cookies.get('admin_token'),
  isAuthenticated: () => !!Cookies.get('admin_token'),
};
